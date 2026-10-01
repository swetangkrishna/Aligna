"""Create persistent user app state for fresh cloud databases."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20261001_app_state"
down_revision = "8bc268f252d9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "user_app_states",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("state", postgresql.JSONB(), nullable=False),
        sa.Column("state_version", sa.Integer(), nullable=False),
        sa.Column("client_updated_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_app_states_user_id", "user_app_states", ["user_id"], unique=True)


def downgrade():
    op.drop_table("user_app_states")
