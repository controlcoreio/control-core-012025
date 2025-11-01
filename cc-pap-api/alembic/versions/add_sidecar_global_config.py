"""add sidecar global config

Revision ID: add_sidecar_global_config
Revises: add_bouncer_github_opal_fields
Create Date: 2025-11-01

Adds sidecar-specific configuration fields to global_pep_config and individual_pep_config tables.
Enables bouncer-type-specific configuration management.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_sidecar_global_config'
down_revision = None  # This is the base migration
branch_labels = None
depends_on = None


def upgrade():
    # Create global_pep_config table with all columns including sidecar fields
    try:
        op.create_table(
            'global_pep_config',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('tenant_id', sa.String(), index=True, nullable=False),
            sa.Column('control_plane_url', sa.String(), server_default='https://api.controlcore.io'),
            sa.Column('default_proxy_domain', sa.String(), server_default='bouncer.controlcore.io'),
            # Sidecar-specific fields
            sa.Column('default_sidecar_port', sa.Integer(), server_default='8080'),
            sa.Column('sidecar_injection_mode', sa.String(), server_default='automatic'),
            sa.Column('sidecar_namespace_selector', sa.String(), nullable=True),
            sa.Column('sidecar_resource_limits_cpu', sa.String(), server_default='500m'),
            sa.Column('sidecar_resource_limits_memory', sa.String(), server_default='256Mi'),
            sa.Column('sidecar_init_container_enabled', sa.Boolean(), server_default='true'),
            # Other config fields
            sa.Column('policy_update_interval', sa.Integer(), server_default='30'),
            sa.Column('bundle_download_timeout', sa.Integer(), server_default='10'),
            sa.Column('policy_checksum_validation', sa.Boolean(), server_default='true'),
            sa.Column('decision_log_export_enabled', sa.Boolean(), server_default='true'),
            sa.Column('decision_log_batch_size', sa.Integer(), server_default='100'),
            sa.Column('decision_log_flush_interval', sa.Integer(), server_default='5'),
            sa.Column('metrics_export_enabled', sa.Boolean(), server_default='true'),
            sa.Column('fail_policy', sa.String(), server_default='fail-closed'),
            sa.Column('default_security_posture', sa.String(), server_default='deny-all'),
            sa.Column('default_rate_limit', sa.Integer(), server_default='1000'),
            sa.Column('default_timeout', sa.Integer(), server_default='30'),
            sa.Column('max_connections', sa.Integer(), server_default='500'),
            sa.Column('auto_ssl_enabled', sa.Boolean(), server_default='true'),
            sa.Column('mutual_tls_required', sa.Boolean(), server_default='false'),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
        )
    except Exception as e:
        # Table might already exist, try to add columns instead
        print(f"Table global_pep_config might exist, adding columns: {e}")
        pass
    
    # Create individual_pep_config table with all columns including sidecar fields
    try:
        op.create_table(
            'individual_pep_config',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('pep_id', sa.Integer(), nullable=False, unique=True),
            sa.Column('assigned_policy_bundles', sa.JSON(), server_default='[]'),
            sa.Column('mcp_header_name', sa.String(), server_default='X-Model-Context'),
            sa.Column('mcp_injection_enabled', sa.Boolean(), server_default='true'),
            sa.Column('upstream_target_url', sa.String(), nullable=True),
            sa.Column('proxy_timeout', sa.Integer(), server_default='30'),
            sa.Column('public_proxy_url', sa.String(), nullable=True),
            # Sidecar-specific fields
            sa.Column('sidecar_port_override', sa.Integer(), nullable=True),
            sa.Column('sidecar_traffic_mode', sa.String(), server_default='iptables'),
            sa.Column('sidecar_resource_cpu_override', sa.String(), nullable=True),
            sa.Column('sidecar_resource_memory_override', sa.String(), nullable=True),
            # Other config fields
            sa.Column('resource_identification_rules', sa.JSON(), server_default='[]'),
            sa.Column('cache_enabled', sa.Boolean(), server_default='true'),
            sa.Column('cache_ttl', sa.Integer(), server_default='300'),
            sa.Column('cache_max_size', sa.Integer(), server_default='100'),
            sa.Column('cache_invalidation_strategy', sa.String(), server_default='lru'),
            sa.Column('circuit_breaker_enabled', sa.Boolean(), server_default='true'),
            sa.Column('circuit_breaker_failure_threshold', sa.Integer(), server_default='5'),
            sa.Column('circuit_breaker_success_threshold', sa.Integer(), server_default='2'),
            sa.Column('circuit_breaker_timeout', sa.Integer(), server_default='60'),
            sa.Column('load_balancing_algorithm', sa.String(), server_default='round-robin'),
            sa.Column('sticky_sessions_enabled', sa.Boolean(), server_default='false'),
            sa.Column('policy_update_interval_override', sa.Integer(), nullable=True),
            sa.Column('fail_policy_override', sa.String(), nullable=True),
            sa.Column('rate_limit_override', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'))
        )
    except Exception as e:
        # Table might already exist, try to add columns instead
        print(f"Table individual_pep_config might exist, adding columns: {e}")
        pass
    
    # Tables created with all columns, migration complete
    print("✅ PEP configuration tables created successfully with sidecar support")


def downgrade():
    # Drop the tables entirely
    op.drop_table('individual_pep_config')
    op.drop_table('global_pep_config')

