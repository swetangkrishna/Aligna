# Visible body fitting

Version 2 replaces the cylinder-and-sphere renderer with an indexed, continuous surface extracted from a smooth union of fitted torso, head and limb volumes. Diameters and joint coordinates are normalized by full silhouette height. The rendering conversion scales every axis consistently.

The fitting samples 25 torso rows and five cross-sections per limb segment. Front/back views supply width and joint positions; side views supply depth and torso centre offsets. Sleeve boundaries limit torso widths when arms touch the body. Limb measurement uses the shorter distance to the silhouette boundary to avoid counting an adjacent body part. Side limb measurements that exceed front width by more than 35% are treated as occluded, with a circular cross-section fallback. Those hidden dimensions remain estimates.

Saved profiles remain readable. “Rebuild from saved photos” reruns fitting on local photos and previews the new result before the user saves. “Compare with source photo” exposes the original image for each selected view. Photos stay in the existing account-scoped device store.

Validation: tests cover diameter units, finite/watertight/connected geometry, shape variation, joined sleeve exclusion, measured joint retention, scanner lifecycle and account isolation. Four user-supplied front/back/side examples were run locally through the same full pose-landmarker model asset using Python MediaPipe 0.10.21, then through the production JavaScript fitting and mesh generation. Front/side mesh renders were inspected. This is not an Android end-to-end test or evidence of anatomical measurement accuracy. The app uses its existing JavaScript MediaPipe runtime.

Limitations: no face or clothing texture reconstruction, no body-composition measurement, no recovery of anatomy hidden by clothing. Perspective, posture differences, loose garments and occluded limbs still affect the fit. No external AI service or Azure inference is added by this change.
