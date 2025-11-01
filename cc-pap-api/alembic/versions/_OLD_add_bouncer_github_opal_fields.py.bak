"""add bouncer github opal fields

Revision ID: add_bouncer_github_opal_fields
Revises: 
Create Date: 2025-10-31

Adds GitHub configuration and sync tracking to BouncerOPALConfiguration.
Creates BouncerSyncHistory table for tracking sync operations.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_bouncer_github_opal_fields'
down_revision = None  # Update this to point to your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Add columns to bouncer_opal_configuration table
    op.add_column('bouncer_opal_configuration', sa.Column('use_tenant_default', sa.Boolean(), server_default='true'))
    op.add_column('bouncer_opal_configuration', sa.Column('custom_repo_url', sa.String()))
    op.add_column('bouncer_opal_configuration', sa.Column('custom_branch', sa.String()))
    op.add_column('bouncer_opal_configuration', sa.Column('custom_access_token', sa.String()))
    op.add_column('bouncer_opal_configuration', sa.Column('folder_path', sa.String()))
    op.add_column('bouncer_opal_configuration', sa.Column('polling_interval', sa.Integer(), server_default='30'))
    op.add_column('bouncer_opal_configuration', sa.Column('webhook_enabled', sa.Boolean(), server_default='false'))
    op.add_column('bouncer_opal_configuration', sa.Column('webhook_secret', sa.String()))
    op.add_column('bouncer_opal_configuration', sa.Column('last_sync_time', sa.DateTime()))
    op.add_column('bouncer_opal_configuration', sa.Column('last_sync_status', sa.String()))
    op.add_column('bouncer_opal_configuration', sa.Column('last_sync_error', sa.Text()))
    op.add_column('bouncer_opal_configuration', sa.Column('policies_count', sa.Integer(), server_default='0'))
    op.add_column('bouncer_opal_configuration', sa.Column('next_sync_time', sa.DateTime()))
    
    # Create bouncer_sync_history table
    op.create_table(
        'bouncer_sync_history',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('bouncer_id', sa.String(), nullable=False),
        sa.Column('sync_time', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.Column('sync_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('policies_synced', sa.Integer(), server_default='0'),
        sa.Column('policies_added', sa.Integer(), server_default='0'),
        sa.Column('policies_updated', sa.Integer(), server_default='0'),
        sa.Column('policies_deleted', sa.Integer(), server_default='0'),
        sa.Column('error_message', sa.Text()),
        sa.Column('error_code', sa.String()),
        sa.Column('duration_ms', sa.Integer()),
        sa.Column('github_api_calls', sa.Integer(), server_default='0'),
        sa.Column('triggered_by', sa.String()),
        sa.Column('commit_sha', sa.String()),
        sa.Column('branch', sa.String())
    )
    
    # Create indexes for performance
    op.create_index('idx_bouncer_sync_history_bouncer', 'bouncer_sync_history', ['bouncer_id'])
    op.create_index('idx_bouncer_sync_history_time', 'bouncer_sync_history', ['sync_time'])
    
    # Create foreign key (if PEP table has bouncer_id column)
    try:
        op.create_foreign_key(
            'fk_bouncer_sync_history_bouncer_id',
            'bouncer_sync_history', 'peps',
            ['bouncer_id'], ['bouncer_id'],
            ondelete='CASCADE'
        )
    except:
        # Foreign key may already exist or bouncer_id column may not exist yet
        pass


def downgrade():
    # Drop indexes
    op.drop_index('idx_bouncer_sync_history_time', table_name='bouncer_sync_history')
    op.drop_index('idx_bouncer_sync_history_bouncer', table_name='bouncer_sync_history')
    
    # Drop table
    op.drop_table('bouncer_sync_history')
    
    # Remove columns from bouncer_opal_configuration
    op.drop_column('bouncer_opal_configuration', 'next_sync_time')
    op.drop_column('bouncer_opal_configuration', 'policies_count')
    op.drop_column('bouncer_opal_configuration', 'last_sync_error')
    op.drop_column('bouncer_opal_configuration', 'last_sync_status')
    op.drop_column('bouncer_opal_configuration', 'last_sync_time')
    op.drop_column('bouncer_opal_configuration', 'webhook_secret')
    op.drop_column('bouncer_opal_configuration', 'webhook_enabled')
    op.drop_column('bouncer_opal_configuration', 'polling_interval')
    op.drop_column('bouncer_opal_configuration', 'folder_path')
    op.drop_column('bouncer_opal_configuration', 'custom_access_token')
    op.drop_column('bouncer_opal_configuration', 'custom_branch')
    op.drop_column('bouncer_opal_configuration', 'custom_repo_url')
    op.drop_column('bouncer_opal_configuration', 'use_tenant_default')

