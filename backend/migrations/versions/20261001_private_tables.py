"""Protect backend-owned tables from direct public Data API access.

The backend connects as the table owner and handles authentication itself.
No client-facing RLS policies are granted.
"""
from alembic import op

revision = "20261001_private_tables"
down_revision = "20261001_app_state"
branch_labels = None
depends_on = None


def upgrade():
    op.execute('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE public.user_app_states ENABLE ROW LEVEL SECURITY')


def downgrade():
    op.execute('ALTER TABLE public.user_app_states DISABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE public.users DISABLE ROW LEVEL SECURITY')
