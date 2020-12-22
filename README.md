# Node.js/Python Web Scraping and Photomosaic API

## Hit this API with a target image file, and it will return a photomosiac version of that image based on images scraped from Google Images.

## URL: https://python-scraper-api.herokuapp.com

This API is hosted on an Express server deployed on Heroku and utilizes Python scripts for webscraping and photomosaic creation.

The Python scripts are run as Node.js child processes.

Bull/Redis are utilized so that the scraping and image processing can be performed as a background job.

## Example Mosaic

![Image of Turtle](https://github.com/alexwang177/python-scraper-api/blob/master/readme_images/turtle.jpg)
![Image of Turtle Mosaic](https://github.com/alexwang177/python-scraper-api/blob/master/readme_images/turtle_mosaic.jpeg)
![Image of Turtle Mosaic Fine](https://github.com/alexwang177/python-scraper-api/blob/master/readme_images/turtle_mosaic_fine.jpeg)

### Routes

#### Post

/mosaic/:tile_query

tile_query: string, google search term

Optional query string parameters:

num_scrape: integer\
width: integer\
height: integer

\*\*\* Request Body

target_image: a jpeg image file

\*\*\* Response

Returns json with the job id of the current image process job that has pushed onto background queue.

#### Get

/mosaic/job/:job_id

job_id: job id of the image process that you wish to check on

\*\*\* If job is finished:

Returns finished mosaic jpeg file

\*\*\* If job is not finished:

Returns json, "Try again later".
