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
            "overflow": "hidden",
            "padding": "0"
        });

        $("." + options.classColumn, layout).width(options.fixedColumnWidth);
        $("." + options.classColumn, layout).height(options.height);
        $("." + options.classColumn + " ." + options.classHeader + " table tbody tr td", layout).width(options.fixedColumnWidth);
        $("." + options.classColumn + " ." + options.classFooter + " table tbody tr td", layout).width(options.fixedColumnWidth);

        //adjust the table widths in the fixedContainer area
        var fh = $(".fixedContainer > ." + options.classHeader + " > table", layout);
        var ft = $(".fixedContainer > .fixedTable > table", layout);
        var ff = $(".fixedContainer > ." + options.classFooter + " > table", layout);

        var maxWidth = fh.width();
        if (ft.length > 0 && ft.width() > maxWidth) { maxWidth = ft.width(); }
        if (ff.length > 0 && ff.width() > maxWidth) { maxWidth = ff.width(); }


        if (fh.length) { fh.width(maxWidth); }
        if (ft.length) { ft.width(maxWidth); }
        if (ff.length) { ff.width(maxWidth); }

        //adjust the widths of the fixedColumn header/footer to match the fixed columns themselves
        $("." + options.classColumn + " > ." + options.classHeader + " > table > tbody > tr:first > td", layout).each(function(pos) {
            var tblCell = $("." + options.classColumn + " > .fixedTable > table > tbody > tr:first > td:eq(" + pos + ")", layout);
            var tblFoot = $("." + options.classColumn + " > ." + options.classFooter + " > table > tbody > tr:first > td:eq(" + pos + ")", layout);
            var maxWidth = $(this).width();
            if (tblCell.width() > maxWidth) { maxWidth = tblCell.width(); }
            if (tblFoot.length && tblFoot.width() > maxWidth) { maxWidth = tblFoot.width(); }
            $(this).width(maxWidth);
            $(tblCell).width(maxWidth);
            if (tblFoot.length) { $(tblFoot).width(maxWidth); }
        });


        //set the height of the table area, minus the heights of the header/footer.
        // note: we need to do this after the other adjustments, otherwise these changes would be overwrote
        var h = options.height - parseInt($(".fixedContainer > ." + options.classHeader, layout).height()) - parseInt($(".fixedContainer > ." + options.classFooter, layout).height());
        //sanity check
        if (h < 0) { h = options.height; }
        $(".fixedContainer > .fixedTable", layout).height(h);
        $("." + options.classColumn + " > .fixedTable", layout).height(h);

        //Adjust the fixed column area if we have a horizontal scrollbar on the main table
        // - specifically, make sure our fixedTable area matches the main table area minus the scrollbar height,
        //   and the fixed column footer area lines up with the main footer area (shift down by the scrollbar height)
        var h = $(".fixedContainer > .fixedTable", layout)[0].offsetHeight - 16;
        $("." + options.classColumn + " > .fixedTable", layout).height(h);  //make sure the row area of the fixed column matches the height of the main table, with the scrollbar

        // Apply the scroll handlers
        $(".fixedContainer > .fixedTable", layout).scroll(function() { handleScroll(wrappingDivId, options); });

        adjustSizes(wrappingDivId, options);
        return originalTable;
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
            //The header *should* be added to our head area now, so we can remove the table header
            $(section, src).remove();
        }
    }

    // ***********************************************
    // Handle the scroll events
    function handleScroll(mainid, options) {
        //Find the scrolling offsets
        var tblarea = $(mainid + " .fixedContainer > .fixedTable");
        var x = tblarea[0].scrollLeft;
        var y = tblarea[0].scrollTop;

        $(mainid + " ." + options.classColumn + " > .fixedTable")[0].scrollTop = y;
        $(mainid + " .fixedContainer > ." + options.classHeader)[0].scrollLeft = x;
        $(mainid + " .fixedContainer > ." + options.classFooter)[0].scrollLeft = x;
    }

    // ***********************************************
    //  Reset the heights of the rows in our fixedColumn area
    function adjustSizes(mainid, options)
    {
        var mainTableHeight = options.height;

        // row height
        $(mainid + " ." + options.classColumn + " .fixedTable table tbody tr").each(function(i) {
            var maxHeight = 0;
            var fixedColumnHeight = $(this).height();
            var contentColumnHeight = $(mainid + " .fixedContainer .fixedTable table tbody tr").eq(i).height();

            if (contentColumnHeight > fixedColumnHeight)
            {
                maxHeight = contentColumnHeight;
            }
            else
            {
                maxHeight = fixedColumnHeight;
            }

            $(this).height(maxHeight);
            $(this).children("td").height(maxHeight);
            $(mainid + " .fixedContainer .fixedTable table tbody tr").eq(i).children("td").height(maxHeight);
        });

        //adjust the cell widths so the header/footer and table cells line up
        var htbale = $(mainid + " .fixedContainer ." + options.classHeader + " table");
        var ttable = $(mainid + " .fixedContainer .fixedTable table");
        var ccount = $(mainid + " .fixedContainer ." + options.classHeader + " table tr:first td").size();
        var widthArray = new Array();
        var totall = 0;

        $(mainid + " .fixedContainer ." + options.classHeader + " table tr:first td").each(function(pos) {
            var cwidth = $(this).width();
            $(mainid + " .fixedContainer .fixedTable table tbody td").each(function(i) {
                if (i % ccount == pos) {
                    if ($(this).width() > cwidth) {
                        cwidth = $(this).width();
                    }
                }
            });
            widthArray[pos] = cwidth;
            totall += (cwidth + 2);
        });

        $(mainid + " .fixedContainer ." + options.classHeader + " table").width(totall + 100);
        $(mainid + " .fixedContainer .fixedTable table").width(totall + 100);
        $(mainid + " .fixedContainer ." + options.classFooter + " table").width(totall + 100);
        for (i = 0; i < widthArray.length; i++) {
            $(mainid + " .fixedContainer ." + options.classHeader + " table tr td").each(function(j) {
                if (j % ccount == i) {
                    $(this).attr("width", widthArray[i] + "px");
                }
            });

            $(mainid + " .fixedContainer .fixedTable table tr td").each(function(j) {
                if (j % ccount == i) {
                    $(this).attr("width", widthArray[i] + "px");
                }
            });

            $(mainid + " .fixedContainer ." + options.classFooter + " table tr td").each(function(j) {
                if (j % ccount == i) {
                    $(this).attr("width", widthArray[i] + "px");
                }
            });
        }

        var contenttbH = $(mainid + " .fixedContainer .fixedTable table").height();
        if (contenttbH < mainTableHeight)
        {
            $(mainid + " ." + options.classColumn + " .fixedTable").height(contenttbH + 20);
            $(mainid + " .fixedContainer .fixedTable").height(contenttbH + 20);

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

        adjustCorners(mainid, options)
    }

    function adjustCorners(mainid, options)
    {
        //Top fixed cell
        var topLeftCorner = $(mainid + " ." + options.classColumn + " ." + options.classHeader + " table tbody tr").eq(0);
        var topHeadRow = $(mainid + " .fixedContainer ." + options.classHeader + " table tbody tr");

        var maxHeight = Math.max(topLeftCorner.height(), topHeadRow.eq(0).height());

        topLeftCorner.children("td").height(maxHeight);
        topHeadRow.children("td").height(maxHeight);

        //Bottom fixed cell
        var bottomLeftCorner = $(mainid + " ." + options.classColumn + " ." + options.classFooter + " table tbody tr").eq(0);
        var bottomFootRow = $(mainid + " .fixedContainer ." + options.classFooter + " table tbody tr");

        maxHeight = Math.max(bottomLeftCorner.height(), bottomFootRow.eq(0).height());

        bottomLeftCorner.children("td").height(maxHeight);
        bottomFootRow.children("td").height(maxHeight);
    }
})(jQuery);
