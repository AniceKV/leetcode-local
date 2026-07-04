# Leetcode Companywise Interview Questions Explorer

![leetcode-companywise-interview-questions](https://socialify.git.ci/snehasishroy/leetcode-companywise-interview-questions/image?description=1&font=JetBrains+Mono&forks=1&language=1&name=1&owner=1&pattern=Solid&stargazers=1&theme=Dark)

A modern, interactive web application to explore, filter, and track company-wise interview questions from LeetCode. 

This repository contains scraped Company-wise Questions categorized based on their recency:
* Last 30 Days
* Last 3 Months
* Last 6 Months
* Last 1 Year
* All

Attributes like **Difficulty**, **Acceptance %**, and **Frequency %** are available to enable precise filtering and sorting to optimize your interview prep.

---

## 🚀 Features

- **Interactive Dashboard:** View question distributions across companies and difficulties.
- **Advanced Filtering:** Filter by company, difficulty, topic tags, and recency.
- **Sorting Options:** Sort questions by frequency, acceptance rate, or difficulty.
- **Progress Tracking:** Sync your solved problems directly from your browser to easily hide or highlight questions you've already completed.

---

## 💻 Requirements

To run this application locally, you will need:
- **[Node.js](https://nodejs.org/)** (v16.0 or higher recommended)
- **npm** (comes bundled with Node.js)

*(Note: Java and Maven are only required if you want to run the data scraper, not for the web application itself).*

---

## 🛠️ User Setup Guide

### 1. Installation
Clone the repository and install the Node dependencies:

```bash
git clone https://github.com/snehasishroy/leetcode-companywise-interview-questions.git
cd leetcode-companywise-interview-questions
npm install
```

### 2. Running the Application
If you are on Windows, you can simply double-click the **`run.bat`** file to start the server and automatically open the application in your browser.

Alternatively, you can run the development server via the terminal:
```bash
npm run dev -- --open
```

### 3. Syncing Your Solved Questions
You can track your progress by syncing your solved questions:
1. Start the application and click the **"Sync Solved"** button in the header.
2. Ensure you are logged into [leetcode.com/problemset/](https://leetcode.com/problemset/) in another tab.
3. Follow the instructions in the modal to paste the provided script into your browser's Developer Console (F12).
4. Paste the resulting array back into the app and click "Import Questions".

---

## 🤖 Data Scraper (For Contributors)
If you have LeetCode Premium and want to contribute by updating the datasets to a more recent snapshot, you can use the built-in Java Selenium scraper. 

Please see the **[Scraper Guide (scrapping.md)](./scrapping.md)** for detailed setup and usage instructions.

---

## Star History

![Alt text](https://api.star-history.com/svg?repos=snehasishroy/leetcode-companywise-interview-questions)

### Happy LeetCoding. May the force be with you!
