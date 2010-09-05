/**
 * From http://github.com/dustinbarnes/jquery-freeze-panes
 *
 * Based on http://plugins.jquery.com/project/FixedTable
 * Several issues were found. Logic errors, poor style, inconsistent functionality,
 * redundant calls, etc., so I am rewriting and optimizing the plugin.
 *
 * Call like so:
 * <script type="text/javascript">
 *     $(document).ready(function()
 *     {
 *         $("#freezePanes").freezePanes();
 *     });
 * </script>
 *
 * The only extra markup required is a wrapping div (with an id) for the table.
 * See samples on github for more ideas.
 */

(function($) {
    var freezePanesDefaults = {
        width: $(window).width() - 20,
        height: $(window).height() - 20,
        fixedFirstColumn: true,
        classHeader: "fixedHead",
        classFooter: "fixedFoot",
        classColumn: "fixedColumn",
        fixedColumnWidth: 225
    };

    $.fn.freezePanes = function(opts) {
        // grab the parent div id for future reference
        var wrappingDivId = "#" + $(this.get(0)).parent().get(0).id;
        var options = $.extend({}, freezePanesDefaults, opts);
        var originalTable = this;

        var layout = buildLayout(originalTable, options);

        //TODO: refactor into methods
        var scrollAreaWidth = options.width - options.fixedColumnWidth;

        $(".fixedContainer ." + options.classHeader, layout).css({
            width: (scrollAreaWidth) + "px",
            "float": "left",
            "overflow": "hidden"
        });

        $(".fixedContainer .fixedTable", layout).css({
            "float": "left",
            width: (scrollAreaWidth + 16) + "px",
            "overflow": "auto"
        });

        $(".fixedContainer", layout).css({
            width: (scrollAreaWidth) + "px",
            "float": "left"
        });

        $(".fixedContainer ." + options.classFooter, layout).css({
            width: (scrollAreaWidth) + "px",
            "float": "left",
            "overflow": "hidden"
        });

        $("." + options.classColumn + " > .fixedTable", layout).css({
            "width": options.fixedColumnWidth + "px",
            "overflow": "hidden"
        });

        adjustSizes(wrappingDivId, layout, options);
        applyScrollHandler(wrappingDivId, layout, options);

        return layout;
    };

    function buildLayout(src, options)
    {
        var fixedArea = $("<div class=\"fixedArea\"></div>").appendTo($(src).parent());

        //fixed column items
        var fixedColumn = $("<div class=\"" + options.classColumn + "\" style=\"float: left;\"></div>").appendTo(fixedArea);
        var fixedColumnHead = $("<div class=\"" + options.classHeader + "\"></div>").appendTo(fixedColumn);
        var fixedColumnBody = $("<div class=\"fixedTable\"></div>").appendTo(fixedColumn);
        var fixedColumnFooter = $("<div class=\"" + options.classFooter + "\"></div>").appendTo(fixedColumn);

        //fixed container items
        var contentContainer = $("<div class=\"fixedContainer\"></div>").appendTo(fixedArea);
        var contentContainerHeader = $("<div class=\"" + options.classHeader + "\"></div>").appendTo(contentContainer);
        var contentContainerBody = $("<div class=\"fixedTable\"></div>").appendTo(contentContainer);
        var contentContainerFooter = $("<div class=\"" + options.classFooter + "\"></div>").appendTo(contentContainer);

        //create the fixed column area
        if ( options.fixedFirstColumn )
        {
            buildFixedColumns(src, "thead", fixedColumnHead);
            buildFixedColumns(src, "tbody", fixedColumnBody);
            buildFixedColumns(src, "tfoot", fixedColumnFooter);
        }

        //Build fixed header / footer rows
        buildFixedRows(src, "thead", contentContainerHeader);
        buildFixedRows(src, "tfoot", contentContainerFooter);

        // Build the main table -- the src table should only be a tbody section with the remaining columns,
        // so we'll just add it to the fixedContainer table area.
        contentContainerBody.append(src);
        return fixedArea;
    }

    function buildFixedColumns(src, section, target)
    {
        if ($(section, src).length) {
            var colHead = $("<table></table>").appendTo(target);

            //If we have a thead or tfoot, we're looking for "TH" elements, otherwise we're looking for "TD" elements
            var cellType = "td";
            if ( section.toLowerCase() == "thead" || section.toLowerCase() == "tfoot" )
            {
                cellType = "th";
            }

            //check each of the rows in the thead
            $(section + " tr", src).each(function() {
                var tr = $("<tr></tr>").appendTo(colHead);
                $(cellType + ":first", this).each(function() {
                    $("<td>" + $(this).html() + "</td>").addClass(this.className).attr("id", this.id).appendTo(tr);
                    //Note, we copy the class names and ID from the original table cells in case there is any processing on them.
                    //However, if the class does anything with regards to the cell size or position, it could mess up the layout.

                    //Remove the item from our src table.
                    $(this).remove();
                });
            });
        }
    }

    function buildFixedRows(src, section, target) {
        if ($(section, src).length) {
            var th = $("<table></table>").appendTo(target);
            var tr = null;

            //This function only manipulates scrollable headers and footers
            var cellType = "th";

            $(section + " tr", src).each(function() {
                var tr = $("<tr></tr>").appendTo(th);
                $(cellType, this).each(function() {
                    $("<td>" + $(this).html() + "</td>").addClass(this.className).attr("id", this.id).appendTo(tr);
                });

            });

            $(section, src).remove();
        }
    }

    function applyScrollHandler(mainid, layout, options)
    {
        $(".fixedContainer > .fixedTable", layout).scroll(function() {
            var tblarea = $(mainid + " .fixedContainer > .fixedTable");
            var x = tblarea[0].scrollLeft;
            var y = tblarea[0].scrollTop;

            $(mainid + " ." + options.classColumn + " > .fixedTable")[0].scrollTop = y;
            $(mainid + " .fixedContainer > ." + options.classHeader)[0].scrollLeft = x;
            $(mainid + " .fixedContainer > ." + options.classFooter)[0].scrollLeft = x;
        });
    }

    function adjustSizes(mainid, layout, options)
    {
        setScrollingAreaHeights(layout, options);
        setRowHeights(mainid, options);
        setColumnWidths(mainid, layout, options);
        adjustTablesForScrollBars(mainid, options);
    }

    function adjustTablesForScrollBars(mainid, options)
    {
        var contentTableHeight = $(mainid + " .fixedContainer .fixedTable table").height();
        if ( contentTableHeight < options.height )
        {
            $(mainid + " ." + options.classColumn + " .fixedTable").height(contentTableHeight + 20);
            $(mainid + " .fixedContainer .fixedTable").height(contentTableHeight + 20);

            // add back 16px for lack of scroll bar
            $(mainid + " .fixedContainer ." + options.classHeader).width($(mainid + " .fixedContainer ." + options.classHeader).width() + 16);
            $(mainid + " .fixedContainer ." + options.classFooter).width($(mainid + " .fixedContainer ." + options.classHeader).width());
        }
        else
        {
            //offset the footer by the height of the scrollbar so that it lines up right.
            $(mainid + " ." + options.classColumn + " > ." + options.classFooter).css({
                "position": "relative",
                "top": 16
            });
        }
    }

    function setRowHeights(mainid, options)
    {
        // Body
        $(mainid + " ." + options.classColumn + " .fixedTable table tbody tr").each(function(i) {
            var fixedColumnHeight = $(this).height();
            var contentColumn = $(mainid + " .fixedContainer .fixedTable table tbody tr").eq(i);
            var maxHeight = Math.max(contentColumn.height(), fixedColumnHeight);

            $(this).children("td").height(maxHeight);
            $(mainid + " .fixedContainer .fixedTable table tbody tr").eq(i).children("td").height(maxHeight);
        });

        // Header
        var topLeftCorner = $(mainid + " ." + options.classColumn + " ." + options.classHeader + " table tbody tr").eq(0);
        var topHeadRow = $(mainid + " .fixedContainer ." + options.classHeader + " table tbody tr");

        var maxHeight = Math.max(topLeftCorner.height(), topHeadRow.eq(0).height());

        topLeftCorner.children("td").height(maxHeight);
        topHeadRow.children("td").height(maxHeight);

        // Footer
        var bottomLeftCorner = $(mainid + " ." + options.classColumn + " ." + options.classFooter + " table tbody tr").eq(0);
        var bottomFootRow = $(mainid + " .fixedContainer ." + options.classFooter + " table tbody tr");

        maxHeight = Math.max(bottomLeftCorner.height(), bottomFootRow.eq(0).height());

        bottomLeftCorner.children("td").height(maxHeight);
        bottomFootRow.children("td").height(maxHeight);
    }

    function setScrollingAreaHeights(layout, options)
    {
        var scrollAreaHeight = options.height - $(".fixedContainer > ." + options.classHeader, layout).height()
                - parseInt($(".fixedContainer > ." + options.classFooter, layout).height());

        $(".fixedContainer > .fixedTable", layout).height(scrollAreaHeight);
        // remove 16px for horizontal scrollbar height
        $("." + options.classColumn + " > .fixedTable", layout).height(scrollAreaHeight - 16);
    }

    function setColumnWidths(mainid, layout, options)
    {
        setFixedColumnWidths(layout, options);
        //TODO: why do we need this array? 
        var widthArray = new Array();
        var totall = 0;

        $(mainid + " .fixedContainer ." + options.classHeader + " table tr:first td").each(function(pos)
        {
            var cwidth = $(this).width();
            var bodyColumn = $(mainid + " .fixedContainer .fixedTable table tbody td:eq(" + pos + ")");
            cwidth = Math.max(cwidth, $(bodyColumn).width());
            widthArray[pos] = cwidth;
            totall += (cwidth + 2);
        });

        //TODO: why +100? just to force scroll bars?
        $(mainid + " .fixedContainer ." + options.classHeader + " table").width(totall + 100);
        $(mainid + " .fixedContainer .fixedTable table").width(totall + 100);
        $(mainid + " .fixedContainer ." + options.classFooter + " table").width(totall + 100);
        for ( var i = 0; i < widthArray.length; i++ )
        {
            $(mainid + " .fixedContainer ." + options.classHeader + " table tr td:eq(" + i + ")").attr("width", widthArray[i] + "px");
            $(mainid + " .fixedContainer .fixedTable table tr td:eq(" + i + ")").attr("width", widthArray[i] + "px");
            $(mainid + " .fixedContainer ." + options.classFooter + " table tr td:eq(" + i + ")").attr("width", widthArray[i] + "px");
        }
    }

    function setFixedColumnWidths(layout, options)
    {
        $("." + options.classColumn + " > ." + options.classHeader + " > table > tbody > tr:first > td", layout).each(function(pos)
        {
            var tblCell = $("." + options.classColumn + " > .fixedTable > table > tbody > tr:first > td:eq(" + pos + ")", layout);
            var tblFoot = $("." + options.classColumn + " > ." + options.classFooter + " > table > tbody > tr:first > td:eq(" + pos + ")", layout);

            //something funky requires the 2 offset. cant place it...
            var width = options.fixedColumnWidth - 2;

            $(this).width(width);
            $(tblCell).width(width);
            $(tblFoot).width(width);
        });
    }
})(jQuery);
