"""Update existing user profilepicture references from default.png to default.jpg.

This migration updates any DB rows that still reference the old
`profilepic/default.png` to `profilepic/default.jpg` so they match the
actual file present in the repository and the new model default.

Reversible: the reverse migration will change `default.jpg` back to
`default.png` for the rows that end with `default.jpg`.
"""
from django.db import migrations


def forwards(apps, schema_editor):
    User = apps.get_model('Product', 'User')
    # Update exact matches and also any values that end with default.png
    User.objects.filter(profilepicture__endswith='default.png').update(profilepicture='profilepic/default.jpg')


def backwards(apps, schema_editor):
    User = apps.get_model('Product', 'User')
    User.objects.filter(profilepicture__endswith='default.jpg').update(profilepicture='profilepic/default.png')


class Migration(migrations.Migration):

    dependencies = [
        ('Product', '0014_rename_added_at_to_invited_at'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
