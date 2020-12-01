from selenium import webdriver

try:
    import time
except:
    print("error time port")


def fetch_image_urls(query: str, max_links_to_fetch: int, wd: webdriver, sleep_between_interactions: int = 1):
    def scroll_to_end(wd):
        try:
            wd.execute_script(
                "window.scrollTo(0, document.body.scrollHeight);")
        except:
            print("scrolling error")
        try:
            time.sleep(sleep_between_interactions)
        except:
            print("sleeping error")

    # build the google query
    search_url = "https://www.google.com/search?safe=off&site=&tbm=isch&source=hp&q={q}&oq={q}&gs_l=img"

    # load the page
    wd.get(search_url.format(q=query))

    image_urls = set()
    image_count = 0
    results_start = 0

    while image_count < max_links_to_fetch:

        try:
            scroll_to_end(wd)
        except:
            print("scroll to end error")

        # get all image thumbnail results
        thumbnail_results = wd.find_elements_by_css_selector("img.Q4LuWd")
        number_results = len(thumbnail_results)

        print(
            f"Found: {number_results} search results. Extracting links from {results_start}:{number_results}")

        for img in thumbnail_results[results_start:number_results]:
            # try to click every thumbnail to get real image
            try:
                img.click()
                time.sleep(sleep_between_interactions)
            except Exception:
                print("img click issue")
                continue

            # extract image urls
            actual_images = wd.find_elements_by_css_selector("img.n3VNCb")
            for actual_image in actual_images:
                if actual_image.get_attribute("src") and "http" in actual_image.get_attribute("src"):
                    image_urls.add(actual_image.get_attribute("src"))

            image_count = len(image_urls)

            if len(image_urls) >= max_links_to_fetch:
                print(f"Found: {len(image_urls)} links, done!")
                break
            else:
                print("Found:", len(image_urls),
                      "image links, looking for more...")
                time.sleep(0.1)
        load_more_button = wd.find_element_by_css_selector(".mye4qd")
        if load_more_button:
            wd.execute_script("document.querySelector('.mye4qd').click();")

        # move result start point
        results_start = len(thumbnail_results)

    return image_urls


DRIVER_PATH = "./drivers/chromedriver"

wd = webdriver.Chrome(executable_path=DRIVER_PATH)

try:
    fetch_image_urls(query="Turtles", max_links_to_fetch=100,
                     wd=wd, sleep_between_interactions=1)
except:
    print("fetching call error")
