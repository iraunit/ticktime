# Generated manually to fix categories field conversion

from django.db import migrations, models
import django.contrib.postgres.fields


class Migration(migrations.Migration):

    dependencies = [
        ('influencers', '0003_remove_influencerprofile_address_and_more'),
    ]

    operations = [
        # First, add a temporary column
        migrations.AddField(
            model_name='influencerprofile',
            name='categories_json',
            field=models.JSONField(blank=True, null=True, help_text='Content categories the influencer specializes in'),
        ),
        
        # Convert data from array to JSON
        migrations.RunSQL(
            # Forward: Convert array to JSON
            """
            UPDATE influencer_profiles 
            SET categories_json = CASE 
                WHEN categories IS NULL THEN '[]'::jsonb
                WHEN array_length(categories, 1) IS NULL THEN '[]'::jsonb
                ELSE to_jsonb(categories)
            END;
            """,
            # Reverse: Convert JSON back to array
            """
            UPDATE influencer_profiles 
            SET categories = CASE 
                WHEN categories_json IS NULL THEN NULL
                WHEN categories_json = '[]'::jsonb THEN NULL
                ELSE array(
                    SELECT jsonb_array_elements_text(categories_json)
                )
            END;
            """
        ),
        
        # Remove the old column
        migrations.RemoveField(
            model_name='influencerprofile',
            name='categories',
        ),
        
        # Rename the new column to the original name
        migrations.RenameField(
            model_name='influencerprofile',
            old_name='categories_json',
            new_name='categories',
        ),
        
        # Set the default value
        migrations.AlterField(
            model_name='influencerprofile',
            name='categories',
            field=models.JSONField(blank=True, default=list, help_text='Content categories the influencer specializes in', null=True),
        ),
    ]
