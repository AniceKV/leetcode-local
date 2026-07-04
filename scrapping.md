# LeetCode Scraper Guide

The `Scraper.java` script located in the `src/main/java` directory is a **Java Selenium script** used to automatically scrape LeetCode questions by company and frequency (e.g., 30-days, 3-months, etc.). It generates the CSV files for each company that are used by this application.

## Prerequisites
1. **Java 17+** must be installed.
2. **Maven** must be installed (it uses `pom.xml` for dependencies like Selenium and Jsoup).
3. **Microsoft Edge** browser must be installed (the script uses `EdgeDriver`).

## Steps to Use the Scraper

**1. Enter Your Credentials:**
Open the file `src/main/java/Scraper.java` and enter your LeetCode Premium credentials at the top of the file (lines ~24-25):
```java
private static final String USERNAME = "your_email@example.com"; 
private static final String PASSWORD = "your_password"; 
```
*(Note: Do not commit these credentials to Git!)*

**2. Run the Script:**
The easiest way to run it is directly from your IDE (like IntelliJ IDEA or Eclipse):
- Open the project in your Java IDE.
- Open `src/main/java/Main.java`.
- Click the green "Run" button next to `public static void main(...)`.

Alternatively, if you want to run it from the terminal via Maven, you can compile and execute it using:
```bash
mvn compile exec:java -Dexec.mainClass="Main"
```

## What the Scraper Does When You Run It:
1. **Logs in:** It opens an Edge browser window and logs into LeetCode using your credentials. It waits 20 seconds to allow the login to process (and for you to solve any captchas manually if they appear).
2. **Finds Companies:** It goes to the `problemset/all/` page to collect the URLs of all the companies listed there.
3. **Scrapes Questions:** For each company, it visits the specific URL for each recency filter (30 days, 3 months, 6 months, etc.). It automatically scrolls the page to load all questions.
4. **Saves CSVs:** It extracts the question ID, URL, title, difficulty, acceptance rate, and frequency, and saves them into CSV files neatly organized in folders by company name (e.g., `Amazon/thirty-days.csv`). 

*Note: If a CSV file already exists for a specific company and timeframe, the scraper will intelligently skip it to resume progress in case it gets interrupted.*
