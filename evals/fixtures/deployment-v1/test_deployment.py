def test_retry_queues_one_job(deployment_harness):
    request = deployment_harness.request()
    deployment_harness.schedule(request)
    deployment_harness.schedule(request)

    assert deployment_harness.job_count(request.id) == 1


def test_success_requires_durable_admission(deployment_harness):
    request = deployment_harness.request()
    result = deployment_harness.schedule(request)

    assert result == {"status": "queued", "request_id": request.id}
    assert deployment_harness.job_count(request.id) == 1
