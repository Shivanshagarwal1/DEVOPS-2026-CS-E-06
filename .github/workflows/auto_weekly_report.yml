name: Weekly Progress Report Auto-Commit

on:
  schedule:
    # Runs every Saturday at 11:59 PM IST (18:29 UTC, Day 6 = Saturday)
    - cron: '29 18 * * 6'
  workflow_dispatch: # Allows manual trigger anytime from the Actions tab

permissions:
  contents: write

jobs:
  generate-and-commit:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository with Full Git History
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'

      - name: Install PDF & Graph Dependencies
        run: |
          pip install reportlab matplotlib

      - name: Generate Weekly PDF Report
        run: |
          python generate_report.py weekly

      - name: Move PDF to Weekly Reports Directory & Commit to Repository
        run: |
          mkdir -p weekly_reports
          mv *_Weekly_Progress_Report_Form-3_*.pdf weekly_reports/

          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"

          git add weekly_reports/
          
          if git diff --staged --quiet; then
            echo "No new changes or reports to commit."
          else
            git commit -m "docs: archive Form-3 weekly progress report [skip ci]"
            git push
          fi
