package com.aligna.app

import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import kotlinx.coroutines.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/** Only barcodes are sent to Open Food Facts. Photos and dietary profiles stay local. */
class FoodProductBridge(private val activity: Activity, private val webView: WebView) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val client = OkHttpClient.Builder().callTimeout(20, TimeUnit.SECONDS).build()
    private var lookupJob: Job? = null
    private var scanning = false
    private var closed = false

    private fun emit(id: String, data: JSONObject) {
        data.put("requestId", id)
        activity.runOnUiThread {
            if (!closed && !activity.isDestroyed) webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('aligna-product-result',{detail:${data}}));", null
            )
        }
    }
    private fun error(id: String, message: String) = emit(id, JSONObject().put("error", message))
    private fun validId(id: String) = id.matches(Regex("[A-Za-z0-9_-]{1,64}"))

    @JavascriptInterface
    fun scan(id: String) {
        if (!validId(id) || closed) return
        activity.runOnUiThread {
            if (scanning) { error(id, "A scan is already open."); return@runOnUiThread }
            scanning = true
            val options = GmsBarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_EAN_13, Barcode.FORMAT_EAN_8, Barcode.FORMAT_UPC_A, Barcode.FORMAT_UPC_E, Barcode.FORMAT_ITF)
                .enableAutoZoom().build()
            try {
                GmsBarcodeScanning.getClient(activity, options).startScan()
                    .addOnSuccessListener { code ->
                        scanning = false
                        emit(id, JSONObject().put("barcode", code.rawValue ?: ""))
                    }
                    .addOnCanceledListener { scanning = false; emit(id, JSONObject().put("cancelled", true)) }
                    .addOnFailureListener { scanning = false; error(id, "Scanner unavailable. Check Google Play services and your connection, or type the barcode below.") }
            } catch (_: Exception) {
                scanning = false; error(id, "Could not open the scanner. You can type the barcode instead.")
            }
        }
    }

    @JavascriptInterface
    fun lookup(barcode: String, id: String) {
        if (!validId(id) || closed) return
        if (!barcode.matches(Regex("(?:[0-9]{8}|[0-9]{12,14})"))) {
            error(id, "Enter an 8, 12, 13 or 14 digit food barcode."); return
        }
        lookupJob?.cancel()
        lookupJob = scope.launch {
            try {
                val fields = "product_name,brands,ingredients_text,ingredients_text_en,allergens_tags,traces_tags,ingredients_analysis_tags,nutriments,nutriscore_grade"
                val request = Request.Builder()
                    .url("https://world.openfoodfacts.org/api/v3/product/$barcode?fields=$fields")
                    .header("User-Agent", "Aligna/1.0 (https://github.com/swetangkrishna/Aligna)")
                    .header("Accept", "application/json").build()
                client.newCall(request).execute().use { response ->
                    ensureActive()
                    when {
                        response.code == 404 -> error(id, "This product is not in Open Food Facts yet. Check the packaging directly.")
                        response.code == 429 -> error(id, "Product lookup is busy. Please try again in a minute.")
                        !response.isSuccessful -> error(id, "Product lookup is unavailable. Please try again later.")
                        else -> {
                            val raw = response.body?.string() ?: "{}"
                            if (raw.length > 250_000) { error(id, "This product record could not be loaded."); return@use }
                            val data = JSONObject(raw)
                            if (data.optJSONObject("product") == null) error(id, "Product not found. Check the packaging directly.")
                            else emit(id, JSONObject().put("data", data).put("barcode", barcode))
                        }
                    }
                }
            } catch (_: CancellationException) {
                // A newer lookup superseded this one.
            } catch (_: Exception) { if (isActive) error(id, "Could not load product details. Check your internet connection.") }
        }
    }
    fun close() { closed = true; scope.cancel(); client.dispatcher.cancelAll() }
}
