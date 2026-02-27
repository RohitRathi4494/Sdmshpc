import re

def expand_scholastic():
    filepath = 'app/components/reports/ReportTemplate_III_VIII.tsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Expand the row height of Scholastic table cells
    # The current scholastic-table CSS is:
    #         .scholastic-table th, .scholastic-table td {
    #             padding-left: 2px !important;
    #             padding-right: 2px !important;
    #         }
    # We want to increase the TOP and BOTTOM padding to make the rows taller.
    old_css = r"""        .scholastic-table th, .scholastic-table td {
            padding-left: 2px !important;
            padding-right: 2px !important;
        }"""
        
    new_css = r"""        .scholastic-table th, .scholastic-table td {
            padding-left: 2px !important;
            padding-right: 2px !important;
            padding-top: 10px !important;
            padding-bottom: 10px !important;
        }"""
    
    content = content.replace(old_css, new_css)
    

    # 2. Make the "Final Result" header column gold again.
    content = content.replace(
        '<th rowSpan={2}>Final Result<br/>(Avg)</th>', 
        '<th rowSpan={2} className="gold-bg">Final Result<br/>(Avg)</th>'
    )
    
    content = content.replace(
        '<th rowSpan={2}>Final Result<br />(Avg)</th>', 
        '<th rowSpan={2} className="gold-bg">Final Result<br />(Avg)</th>'
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Expanded Scholastic Rows successfully.")

if __name__ == '__main__':
    expand_scholastic()
