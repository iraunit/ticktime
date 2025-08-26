from django.db import migrations, models


def drop_m2m_table(apps, schema_editor):
    connection = schema_editor.connection
    m2m_table = 'campaigns_campaign_categories'
    with connection.cursor() as cursor:
        try:
            cursor.execute(f'DROP TABLE IF EXISTS "{m2m_table}"')
        except Exception:
            pass


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0009_remove_campaign_campaigns_campaig_ae7bbc_idx_and_more'),
        ('common', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='campaign',
            name='categories',
        ),
        migrations.AddField(
            model_name='campaign',
            name='industry',
            field=models.CharField(default='other', max_length=50, choices=[
                ('fashion_beauty', 'Fashion & Beauty'),
                ('food_lifestyle', 'Food & Lifestyle'),
                ('tech_gaming', 'Tech & Gaming'),
                ('fitness_health', 'Fitness & Health'),
                ('travel', 'Travel'),
                ('entertainment', 'Entertainment'),
                ('education', 'Education'),
                ('business_finance', 'Business & Finance'),
                ('other', 'Other'),
            ]),
        ),
        migrations.RunPython(drop_m2m_table, migrations.RunPython.noop),
        migrations.AddIndex(
            model_name='campaign',
            index=models.Index(fields=['industry'], name='campaigns_industry_idx'),
        ),
    ]


