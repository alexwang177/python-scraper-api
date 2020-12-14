const maxJobsPerWorker = 50;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.process = function(workQueue) {
  workQueue.process(maxJobsPerWorker, async job => {
    let progress = 0;

    while (progress < 5) {
      await sleep(1000);
      progress += 1;
      console.log(progress + " seconds");
      job.progress(progress);
    }

    return { value: "This is important data" };
  });
};
