from django.contrib import admin
from django.contrib.admin.sites import NotRegistered

from .models import (
    CrontabScheduleProxy,
    Industry,
    ContentCategory,
    CountryCode,
    IntervalScheduleProxy,
    PeriodicTaskProxy,
)


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ['name', 'key', 'description', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'key', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name']

    fieldsets = (
        ('Industry Information', {
            'fields': ('key', 'name', 'description', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).order_by('name')


@admin.register(ContentCategory)
class ContentCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'key', 'industry', 'description', 'is_active', 'created_at']
    list_filter = ['industry', 'is_active', 'created_at']
    search_fields = ['name', 'key', 'description', 'industry__name']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['industry__name', 'sort_order', 'name']

    fieldsets = (
        ('Category Information', {
            'fields': ('key', 'name', 'description', 'icon', 'color', 'is_active', 'sort_order')
        }),
        ('Industry Association', {
            'fields': ('industry',),
            'description': 'Select the industry this content category belongs to'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).order_by('sort_order', 'name')


@admin.register(CountryCode)
class CountryCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'shorthand', 'country', 'flag', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['code', 'shorthand', 'country']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['country']

    fieldsets = (
        ('Country Code Information', {
            'fields': ('code', 'shorthand', 'country', 'flag', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).order_by('country')


# -----------------------------
# Operational tables under /admin/common/
# -----------------------------

# Hide django-celery-beat's own admin group and show via proxy models under "common"
try:
    from django_celery_beat.models import CrontabSchedule, IntervalSchedule, PeriodicTask

    try:
        admin.site.unregister(PeriodicTask)
    except NotRegistered:
        pass
    try:
        admin.site.unregister(IntervalSchedule)
    except NotRegistered:
        pass
    try:
        admin.site.unregister(CrontabSchedule)
    except NotRegistered:
        pass
except Exception:
    # If dependency not installed yet, skip.
    pass


@admin.register(PeriodicTaskProxy)
class PeriodicTaskProxyAdmin(admin.ModelAdmin):
    list_display = ["name", "task", "enabled", "interval", "crontab", "one_off", "last_run_at", "total_run_count"]
    list_filter = ["enabled", "one_off", "task"]
    search_fields = ["name", "task", "description"]
    ordering = ["name"]


@admin.register(IntervalScheduleProxy)
class IntervalScheduleProxyAdmin(admin.ModelAdmin):
    list_display = ["every", "period"]
    ordering = ["period", "every"]


@admin.register(CrontabScheduleProxy)
class CrontabScheduleProxyAdmin(admin.ModelAdmin):
    list_display = ["minute", "hour", "day_of_week", "day_of_month", "month_of_year", "timezone"]
    ordering = ["timezone", "month_of_year", "day_of_month", "day_of_week", "hour", "minute"]


# Celery task execution logs (owned by common)
from .models import CeleryTask


@admin.register(CeleryTask)
class CeleryTaskAdmin(admin.ModelAdmin):
    list_display = ["task_name", "task_id_short", "status", "created_at", "completed_at", "duration_display"]
    list_filter = ["status", "task_name", "created_at"]
    search_fields = ["task_id", "task_name"]
    readonly_fields = ["task_id", "task_name", "status", "result", "error", "created_at", "updated_at", "completed_at"]
    ordering = ["-created_at"]

    fieldsets = (
        ("Task Information", {"fields": ("task_id", "task_name", "status")}),
        ("Results", {"fields": ("result", "error"), "classes": ("collapse",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at", "completed_at"), "classes": ("collapse",)}),
    )

    def task_id_short(self, obj):
        return obj.task_id[:16] + "..." if len(obj.task_id) > 16 else obj.task_id

    task_id_short.short_description = "Task ID"

    def duration_display(self, obj):
        if obj.completed_at and obj.created_at:
            delta = obj.completed_at - obj.created_at
            total_seconds = int(delta.total_seconds())
            hours, remainder = divmod(total_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            if hours > 0:
                return f"{hours}h {minutes}m {seconds}s"
            if minutes > 0:
                return f"{minutes}m {seconds}s"
            return f"{seconds}s"
        return "-"

    duration_display.short_description = "Duration"

    def has_add_permission(self, request):
        return False
