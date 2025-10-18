from rest_framework.response import Response


def format_serializer_errors(serializer_errors):
    """Convert serializer errors to readable string"""
    error_messages = []
    for field, errors in serializer_errors.items():
        if isinstance(errors, list):
            error_messages.append(f"{field}: {', '.join(errors)}")
        else:
            error_messages.append(f"{field}: {errors}")
    return '; '.join(error_messages)


def api_response(success: bool, result=None, error: str = None, status_code: int = 200):
    """Simple API response function"""
    if success:
        return Response({"success": True, "result": result}, status=status_code)
    else:
        return Response({"success": False, "error": error}, status=status_code)
