"use strict";

(function(Backbone, _, $) {

    Backbone.StackRouter = Backbone.Router.extend({
        // to be defined in subclass
        startPage: null,

        initialize: function() {

            var that = this;

            // Keep track of the history of pages (we only store the page URL). Used to identify the direction
            // (left or right) of the sliding transition between pages.
            this.pageHistory = [];
        },

        slidePage: function(page) {
            var slideFrom,
            that = this;

            if (!this.currentPage) {
                // If there is no current page (app just started) -> No transition: Position new page in the view port
                $(page.el).attr('class', 'page stage-center');
                $('#content').append(page.el);
                this.pageHistory = [window.location.hash];
                this.currentPage = page;
                return;
            }

            // Cleaning up: remove old pages that were moved out of the viewport
            $('.stage-right, .stage-left').not('#startPage').remove();

            if (page === this.startPage) {
                // Always apply a Back (slide from left) transition when we go back to the search page
                slideFrom = "left";
                $(page.el).attr('class', 'page stage-left');
                // Reinitialize page history
                this.pageHistory = [window.location.hash];
            } 
            else if (this.pageHistory.length > 1 && window.location.hash === this.pageHistory[this.pageHistory.length - 2]) {
                // The new page is the same as the previous page -> Back transition
                slideFrom = "left";
                $(page.el).attr('class', 'page stage-left');
                this.pageHistory.pop();
            } 
            else {
                // Forward transition (slide from right)
                slideFrom = "right";
                $(page.el).attr('class', 'page stage-right');
                this.pageHistory.push(window.location.hash);
            }

            $('#content').append(page.el);

            // Wait until the new page has been added to the DOM...
            setTimeout(function() {
                // Slide out the current page: If new page slides from the right -> slide current page to the left, and vice versa
                $(that.currentPage.el).attr('class', 'page transition ' + (slideFrom === "right" ? 'stage-left' : 'stage-right'));
                // Slide in the new page
                $(page.el).attr('class', 'page stage-center transition');
                that.currentPage = page;
            });

        }
    });

})(Backbone, _,  $);
