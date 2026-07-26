let attempts = 0;

async function sendWithOneRetry(send) {
  try {
    return await send();
  } catch (_error) {
    return send();
  }
}

async function ambiguousProviderCall() {
  attempts += 1;
  if (attempts === 1) {
    throw new Error("timeout after provider acceptance is unknown");
  }
  return { status: "accepted" };
}

sendWithOneRetry(ambiguousProviderCall)
  .then((result) => {
    console.log(JSON.stringify({ attempts, result }));
  })
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
