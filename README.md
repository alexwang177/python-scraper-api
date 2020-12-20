### Node.js/Python Web Scraping and Photomosaic API

## Hit this API with a target image file, and it will return a photomosiac version of that image based on images scraped from Google Images

# This API is hosted on an Express server deployed on Heroku and utilizes Python scripts for webscraping and photomosaic creation

# The Python scripts are run as Node.js child processes

# Bull/Redis are utilized so that the scraping and image processing can be performed as a background job
