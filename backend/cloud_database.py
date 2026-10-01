"""Connect and migrate using private local inputs without logging credentials."""
import asyncio
import os
from pathlib import Path
import ssl
import sys
from urllib.parse import quote

import asyncpg

ROOT = Path(__file__).resolve().parent
CA_FILE = ROOT / 'certs' / 'supabase-ca.crt'
values = dict(line.split('=', 1) for line in (ROOT / '.env.cloud.local').read_text().splitlines()
              if line and not line.startswith('#') and '=' in line)
password = values['SUPABASE_DB_PASSWORD']
if not password or password == 'REPLACE_WITH_NEW_PASSWORD':
    raise SystemExit('A new database password must be saved locally first.')
host = values['SUPABASE_DB_HOST']
if host != 'aws-1-eu-west-1.pooler.supabase.com':
    raise SystemExit('Unexpected database host; stopping.')

async def check():
    conn = await asyncpg.connect(host=host, port=int(values['SUPABASE_DB_PORT']),
        user=values['SUPABASE_DB_USER'], password=password,
        database=values['SUPABASE_DB_NAME'], ssl=ssl.create_default_context(cafile=str(CA_FILE)), timeout=20)
    try:
        tables = await conn.fetch("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
        print('Verified TLS database connection succeeded.')
        print('Public tables:', ', '.join(r['tablename'] for r in tables) or '(none)')
        return tables
    finally:
        await conn.close()

try:
    tables = asyncio.run(check())
    if '--migrate' in sys.argv:
        known = {'users', 'user_app_states', 'alembic_version'}
        if any(r['tablename'] not in known for r in tables):
            raise SystemExit('Unexpected existing tables; stopping before migration.')
        url = ('postgresql+asyncpg://' + quote(values['SUPABASE_DB_USER'], safe='') + ':'
               + quote(password, safe='') + '@' + host + ':' + values['SUPABASE_DB_PORT']
               + '/' + values['SUPABASE_DB_NAME'] + '?ssl=verify-full')
        os.environ['PGSSLROOTCERT'] = str(CA_FILE)
        os.environ['DATABASE_URL'] = url
        os.chdir(ROOT)
        from alembic import command
        from alembic.config import Config
        command.upgrade(Config(str(ROOT / 'alembic.ini')), 'head')
        tables = asyncio.run(check())
        protected = {r['tablename']: r['rowsecurity'] for r in tables}
        if not all(protected.get(t) for t in ('users', 'user_app_states')):
            raise SystemExit('Table protection verification failed.')
        print('Migration complete; both application tables have row-level security enabled.')
except Exception as exc:
    print('Database setup failed (' + type(exc).__name__ + '). Credentials and connection details suppressed.')
    sys.exit(1)
