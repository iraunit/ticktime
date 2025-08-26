# Generated manually to update timeline fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0007_remove_content_count'),
    ]

    operations = [
        # Remove old timeline fields
        migrations.RemoveField(
            model_name='campaign',
            name='content_creation_start',
        ),
        migrations.RemoveField(
            model_name='campaign',
            name='content_creation_end',
        ),
        migrations.RemoveField(
            model_name='campaign',
            name='campaign_start_date',
        ),
        migrations.RemoveField(
            model_name='campaign',
            name='campaign_end_date',
        ),
        
        # Update submission_deadline to be nullable
        migrations.AlterField(
            model_name='campaign',
            name='submission_deadline',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Add campaign_live_date field
        migrations.AddField(
            model_name='campaign',
            name='campaign_live_date',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Update indexes
        migrations.AlterIndexTogether(
            name='campaign',
            index_together=set(),
        ),
    ]
