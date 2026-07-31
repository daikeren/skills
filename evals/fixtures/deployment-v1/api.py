def post_deployment(request, schedule_deployment):
    return schedule_deployment(
        request_id=request.request_id,
        release_ref=request.json["release_ref"],
        requested={
            "artifact_uri": request.json["artifact_uri"],
            "runtime_class": request.json["runtime_class"],
            "network_profile": request.json["network_profile"],
        },
    )
