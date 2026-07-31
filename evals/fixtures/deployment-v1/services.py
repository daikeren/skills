class DeploymentControlPlane:
    def launch(self, *, release_ref, requested, request_id):
        ...

    def launch_unchecked(self, *, release_ref, requested, request_id):
        ...


deployment = DeploymentControlPlane()
