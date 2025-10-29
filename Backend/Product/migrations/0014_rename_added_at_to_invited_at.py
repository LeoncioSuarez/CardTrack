from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("Product", "0013_boardmembership"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                "ALTER TABLE Product_boardmembership "
                "CHANGE added_at invited_at DATETIME(6) NOT NULL;"
            ),
            reverse_sql=(
                "ALTER TABLE Product_boardmembership "
                "CHANGE invited_at added_at DATETIME(6) NOT NULL;"
            ),
        ),
    ]
