from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0006_remove_campaign_categories_campaign_categories'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='campaign',
            name='content_count',
        ),
    ]
