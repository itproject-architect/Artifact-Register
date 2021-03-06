(function(){
    function VerticalTimeline( element ) {
        this.element = element;
        this.blocks = this.element.getElementsByClassName("js-cd-block");
        this.images = this.element.getElementsByClassName("js-cd-img");
        this.contents = this.element.getElementsByClassName("js-cd-content");
        this.offset = 0.8;
        this.hideBlocks();
    };
    VerticalTimeline.prototype.hideBlocks = function() {
        //hide timeline blocks which are outside the viewport
        if ( !"classList" in document.documentElement ) {
            return;
        }
        var self = this;
        for( var i = 0; i < this.blocks.length; i++) {
            (function(i){
                if( self.blocks[i].getBoundingClientRect().top > window.innerHeight*self.offset ) {
                    self.images[i].classList.add("cd-is-hidden");
                    self.contents[i].classList.add("cd-is-hidden");
                }
            })(i);
        }
    };

    VerticalTimeline.prototype.showBlocks = function() {
        if ( ! "classList" in document.documentElement ) {
            return;
        }
        var self = this;
        for( var i = 0; i < this.blocks.length; i++) {
            (function(i){
                if( self.contents[i].classList.contains("cd-is-hidden") && self.blocks[i].getBoundingClientRect().top <= window.innerHeight*self.offset ) {
                    // add bounce-in animation
                    self.images[i].classList.add("cd-timeline__img--bounce-in");
                    self.contents[i].classList.add("cd-timeline__content--bounce-in");
                    self.images[i].classList.remove("cd-is-hidden");
                    self.contents[i].classList.remove("cd-is-hidden");
                }
            })(i);
        }
    };

    var verticalTimelines = document.getElementsByClassName("js-cd-timeline"),
        verticalTimelinesArray = [],
        scrolling = false;
    if( verticalTimelines.length > 0 ) {
        for( var i = 0; i < verticalTimelines.length; i++) {
            (function(i){
                verticalTimelinesArray.push(new VerticalTimeline(verticalTimelines[i]));
            })(i);
        }

        //show timeline blocks on scrolling
        window.addEventListener("scroll", function(event) {
            if( !scrolling ) {
                scrolling = true;
                (!window.requestAnimationFrame) ? setTimeout(checkTimelineScroll, 250) : window.requestAnimationFrame(checkTimelineScroll);
            }
        });
    }

    function checkTimelineScroll() {
        verticalTimelinesArray.forEach(function(timeline){
            timeline.showBlocks();
        });
        scrolling = false;
    }
})();


$("#menu-toggle").click(function(e) {
    e.preventDefault();
    $("#wrapper").toggleClass("toggled");
});



$(function(){

    var btnLoader = document.querySelector('.btnLoader');

    btnLoader.addEventListener("click", function() {
        /*btnLoader.innerHTML = "Signing In";*/
        btnLoader.classList.add('spinning');

        setTimeout(
            function  (){
                btnLoader.classList.remove('spinning');
                /*btnLoader.innerHTML = "Sign In";*/
            }, 6000);
    }, false);

});

$(document).ready(function() {
    $('body').bootstrapMaterialDesign();
    $('[data-toggle="tooltip"]').tooltip()});
// Tooltips Initialization


$("input[name='delete']").click(function(){
    bootbox.confirm({
        title: "Delete Post",
        message: "Do you want to delete this post now? This cannot be undone.",
        buttons: {
            cancel: {
                label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
                label: '<i class="fa fa-check"></i> Confirm'
            }
        },
        callback: function (result) {
            if(result == true)
                $('#delete-form').submit();
        }
    });
});



$('#back-button').click(function(e){
    e.preventDefault();
    href = $(this).attr('href');
    bootbox.confirm({
        title: "Go Back",
        message: "Do you want to go back now? ",
        buttons: {
            cancel: {
                label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
                label: '<i class="fa fa-check"></i> Confirm'
            }
        },
        callback: function (result) {
            if(result ==true)
                window.location = href;
        }
    });
});

function displayDate(){
    var today;
    var n_day;
    var day;
    today = new Date();
    n_day = today.getDay();
    switch (n_day){
        case 0: day = "Sunday"; break;
        case 1: day = "Monday"; break;
        case 0: day = "Tuesday"; break;
        case 0: day = "Wednesday"; break;
        case 0: day = "Thursday"; break;
        case 0: day = "Friday"; break;
        case 0: day = "Saturday"; break;
    }
    this.document.write(today.getFullYear()+'.'+(today.getMonth()+1)+"."+today.getDate()+"  "+day);
}

/*description word count for new/edit postings*/

var max_word = 300;
var text_length = $('#descArea').val().length;
var text_remaining = max_word - text_length;
$('#count_message').html(text_remaining  + ' remaining');
$('#descArea').keyup(function() {
    text_length = $('#descArea').val().length;
    text_remaining = max_word - text_length;

    $('#count_message').html(text_remaining + ' remaining');

    if (text_remaining < 0) {
        console.log("Disable");
        $('#submit-post').prop("disabled", true);
        document.getElementById("count_message").style.color = "#fabea6";
    } else if ($('#submit-post').prop("disabled")) {
        console.log("Enable");
        $('#submit-post').prop("disabled", false);
    }
});

