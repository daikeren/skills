from .services import deployment


def schedule_deployment(*, request_id, release_ref, requested):
    deployment.launch(
        release_ref=release_ref,
        requested=requested,
        request_id=request_id,
    )
    return {"status": "queued", "request_id": request_id}
