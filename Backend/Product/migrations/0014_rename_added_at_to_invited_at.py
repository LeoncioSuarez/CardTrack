from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("Product", "0013_boardmembership"),
    ]

    def _rename_added_to_invited(apps, schema_editor):
        # Resolve the actual table name from the model to avoid case issues
        Model = apps.get_model('Product', 'BoardMembership')
        table = schema_editor.connection.ops.quote_name(Model._meta.db_table)
        with schema_editor.connection.cursor() as cursor:
            # If added_at exists, rename to invited_at; otherwise, no-op
            cursor.execute(f"SHOW COLUMNS FROM {table} LIKE %s", ('added_at',))
            has_added = cursor.fetchone() is not None
            if has_added:
                cursor.execute(
                    f"ALTER TABLE {table} CHANGE `added_at` `invited_at` DATETIME(6) NOT NULL"
                )

    def _rename_invited_to_added(apps, schema_editor):
        Model = apps.get_model('Product', 'BoardMembership')
        table = schema_editor.connection.ops.quote_name(Model._meta.db_table)
        with schema_editor.connection.cursor() as cursor:
            cursor.execute(f"SHOW COLUMNS FROM {table} LIKE %s", ('invited_at',))
            has_invited = cursor.fetchone() is not None
            if has_invited:
                cursor.execute(
                    f"ALTER TABLE {table} CHANGE `invited_at` `added_at` DATETIME(6) NOT NULL"
                )

    operations = [
        migrations.RunPython(_rename_added_to_invited, _rename_invited_to_added),
    ]
