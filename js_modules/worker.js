const Mosaic = require("./mosaic.js");

const maxJobsPerWorker = 50;

module.exports.process = async function(workQueue) {
  workQueue.process(maxJobsPerWorker, async job => {
    console.log("This is tile query: " + job.data.tile_query);

    let tileDirectory = await Mosaic.scrape(
      job.data.tile_query,
      job.data.num_scrape
    );
    return await Mosaic.makeMosaic(
      tileDirectory,
      job.data.width,
      job.data.height
    );
  });
};
