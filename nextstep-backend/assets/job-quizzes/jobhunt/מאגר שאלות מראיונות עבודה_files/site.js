jQuery(function($){
var appScriptUrl = "https://script.google.com/macros/s/AKfycbx0ZnTuJ_uX0hNqxD0HtbiMXVOcXtg7ZsviHpwgPzJksVsbskI/exec"

$(document).ready(function(){
    $("#recruiters-form-result").hide();
    $("#recruiters-form-loader").hide();

    $("#specialPlansDialog .spd").hide();

    /*if(window.innerWidth<768){
        $(".plan-price").not('.extra').css({'margin-bottom': '40px'})
        $(".terms-all").css({'bottom': '78px'})
    }*/

    createReadMoreButtons();

    $(".menu-item-has-children > a").on("click", function(event) {
        event.preventDefault();
        if ($(window).width() <= 991) {
            const isOpen = $(this).parent(".menu-item-has-children").hasClass("show");
            $(".menu-item-has-children").removeClass("show");
            if (!isOpen){
                $(this).parent(".menu-item-has-children").addClass("show");
            }
        }
    });

    $(document).on('click','.navbar-collapse a:not(.menu-item-has-children > a) ', function(){
        if ($(window).width() <= 991) {
            $(".menu-item-has-children").removeClass("show");
        }
        $(".navbar-collapse").collapse('hide');
    });
    
    $(window).scroll(function() {
		var scrollPos = $(window).scrollTop();
		if(scrollPos > 0) {
			$('#header').addClass('shadow');
			 
		} else {
			$('#header').removeClass('shadow');
		}
	});

    $(".page-id-1888 .jh-button").each(function( index ) {
        if (index%3===1){
            $(this).removeAttr("data-toggle");
            $(this).removeAttr("data-target");
            $(this).html(`<a target="_blank" href="/plans" class="button">למסלולים</a>`);
        }else if (index%3===2){
            $(this).removeAttr("data-toggle");
            $(this).removeAttr("data-target");
            $(this).html(`<a target="_blank" href="https://www.google.com/search?q=jobhunt+israel&amp;sxsrf=AOaemvIFZWyEfPsn-oDgeKMc0z6XADX7Tw%3A1632141836327&amp;ei=DIJIYca5E8-X8gLFo6PgAg&amp;oq=jobhunt+israel&amp;gs_lcp=Cgdnd3Mtd2l6EAMyBQgAEIAEMgIIJjoHCCMQsAMQJzoHCAAQRxCwAzoQCC4QxwEQrwEQyAMQsAMQQzoQCC4QxwEQ0QMQyAMQsAMQQzoKCC4QyAMQsAMQQzoECCMQJzoFCAAQywE6CggAEIAEEIcCEBQ6BwgAEIAEEAo6BggAEBYQHjoICAAQFhAKEB46BQgAEJECSgUIOBIBMUoECEEYAFDnpi5Y0MYuYJvQLmgCcAJ4AIABiAKIAYoJkgEFMC43LjGYAQCgAQHIAQ_AAQE&amp;sclient=gws-wiz&amp;ved=0ahUKEwjG74GTyo3zAhXPi1wKHcXRCCwQ4dUDCA4&amp;uact=5#lrd=0x1502ca0623678333:0x82c30d46d17d80e8,1,,," class="button">להמלצות נוספות</a>`);
        }
    });

    $("#videoPlayerModal").on('hide.bs.modal', function(){
        $('#videoPlayerModal .modal-dialog').html('');
        //$('#videoPlayerModal .modal-body').html('');
        //$('#modal-video-title').html('');
    });

    createReadMoreButtonsReviews();

    $(".youtube-video-image").each(function( index ) {
        $(this).height($(this).width() / 1.8);
    });

    $(".label-with-line").removeClass("start");            
});

$( window ).resize(function() {
    createReadMoreButtonsReviews();

    $(".youtube-video-image").each(function( index ) {
        $(this).height($(this).width() / 1.8);
    });

});

$(document).on('click','.play-button', function(){
    //$('#videoPlayerModal .modal-body').html('<iframe style="max-width: 100%;" width="500" height="281" src="https://www.youtube.com/embed/' + $(this).attr("data-video-id") + '?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
    //$('#modal-video-title').html($(this).attr("data-video-title"));            

    var width = $(window).width();

    if(width > 854){
        width = 854;
    }
    var height = width / 1.779;

    $('#videoPlayerModal .modal-dialog').html('<iframe style="max-width: 854px" width="100%" height="' + height + '" src="https://www.youtube.com/embed/' + $(this).attr("data-video-id") + '?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>');
    $('#videoPlayerModal').modal('show');
});

$(document).on('click', '.gr-description-read-more', function(){
    if($(this).prev(".gr-description")){
        $(this).prev(".gr-description").removeClass("hidden-text")
        $(this).remove();
    }
});

function createReadMoreButtonsReviews(){
    $(".gr-description").removeClass("hidden-text")
    $(".gr-description-read-more").remove();

    $(".gr-description").each(function() {
        if ($(this).height() > 54){
            $(this).addClass("hidden-text");
            $(this).after('<span class="gr-description-read-more">קרא עוד</span>');
        }
    });
}

$(document).on('click','#menu-top li', function(){
    var menu_label = false

    switch($(this).attr('id')){
        case 'menu-item-9999':{
            menu_label = 'Pricing';
            break;
        } case 'menu-item-3360':{
            menu_label = 'Our method';
            break;
        } case 'menu-item-3361':{
            menu_label = 'Our team';
            break;
        } case 'menu-item-3362':{
            menu_label = 'Recommendations';
            break;
        } case 'menu-item-3363':{
            menu_label = 'Q&A';
            break;
        } case 'menu-item-3365':{
            menu_label = 'Recruiter';
            break;
        } case 'menu-item-3366':{
            menu_label = 'Forums';
            break;
        } case 'menu-item-3364':{
            menu_label = 'Contact us';
            break;
        } default:{}
    }

    if(menu_label){
        ga('send', {
            hitType: 'event',
            eventCategory: 'Menu',
            eventAction: capitalizeFirstLetter('Menu_' + menu_label.replace(/[ ]/mgi, "_") + '_click'),
            eventLabel: menu_label
        });

        gtag('event', capitalizeFirstLetter('Menu_' + menu_label.replace(/[ ]/mgi, "_") + '_click'), {
            'event_category' : 'Menu',
            'event_label' : menu_label
        });
    }
});

$(document).on('submit','#recruiters-form', function(){
    $("#recruiters-form").hide();

    var params = ConvertFormToJSON($(this));

    $("#recruiters-form-loader").show();

    callGoogleScript('joinRecruiters', params, function(data, textStatus, jqXHR){
        ga('send', {
            hitType: 'event',
            eventCategory: 'Home_page_recruiter_section',
            eventAction: 'Home_page_recruiter_sumbit_success',
            eventLabel: 'Recruiter - success'
        });

        gtag('event', 'Home_page_recruiter_sumbit_success', {
            'event_category' : 'Home_page_recruiter_section',
            'event_label' : 'Recruiter - success'
        });

        $("#recruiters-form-loader").hide();
        $(".jot-content.description").hide();
        $("#recruiters-form-result").show();
        console.log(data)
    }, function(jqXHR, textStatus, errorThrown){
        ga('send', {
            hitType: 'event',
            eventCategory: 'Home_page_recruiter_section',
            eventAction: 'Home_page_recruiter_sumbit_fail',
            eventLabel: 'Recruiter - fail'
        });

        gtag('event', 'Home_page_recruiter_sumbit_fail', {
            'event_category' : 'Home_page_recruiter_section',
            'event_label' : 'Recruiter - fail'
        });

        $("#recruiters-form-loader").hide();
        $("#recruiters-form").show();
        console.log('fail')
    });

    return false;
});

$(document).on('click','.ga-analyze', function(){
    var category = $(this).attr("data-ga-category");
    var action = $(this).attr("data-ga-action");
    var label = $(this).attr("data-ga-label");

    if (category && action && label){
        ga('send', {
            hitType: 'event',
            eventCategory: category,
            eventAction: action,
            eventLabel: label
        });

        gtag('event', action, {
            'event_category' : category,
            'event_label' : label
        });
    }
});

$(document).on('click', '.service-desc-read-more', function(){
    if($(this).prev(".servive-desc")){
        $(this).prev(".servive-desc").removeClass("hidden-text")
        $(this).remove();
    }
});

/*$(document).on('click', '.tabButton', function(){
    $(".tabButton").removeClass('active')
	$(this).addClass('active')

    $(".need-approve").hide();
    $('.termsCheckBox input').prop('checked', false);
    if(window.innerWidth<768){
        $(".plan-price").css({'margin-bottom': '40px'})
        $(".terms-all").css({'bottom': '78px'})
    }

    $(".plan-sevices").hide();
    switch($(this).attr("data-plan")){
        case 'beginnersExperienced':{
            $(".plan-sevices.plan-beginnersExperienced").show();
            tabSelected = $(this).attr("data-plan")
            break;
        }
        case 'executive':{
            $(".plan-sevices.plan-executive").show();
            tabSelected = $(this).attr("data-plan")
            break;
        }
        default:{}
    }

    createReadMoreButtons()
});*/

/*$(document).on('click', '.termsCheckBox', function(){
    var dataPlan = $(this).attr("data-plan");

    if(window.innerWidth>767 || dataPlan === 'personalCounselingHour' || dataPlan === 'checkRecommenders' || dataPlan === 'interviewSimulation'){
        if (fixedPlansHeader){
            if ($('#plans-header-fixed .plan-' + dataPlan + ' .termsCheckBox input').prop('checked')) {
                $('#plans-header-fixed .plan-' + dataPlan + ' .need-approve').hide();
                $('#plans-header-fixed .plan-' + dataPlan + ' .termsCheckBox input').attr('checked', 'checked');
            } else {
                $('#plans-header-fixed .plan-' + dataPlan + ' .termsCheckBox input').removeAttr('checked');
            }
        } else {
            if ($('.plan-' + tabSelected + ' .plan-' + dataPlan + ' .termsCheckBox input').prop('checked')) {
                $('.plan-' + tabSelected + ' .plan-' + dataPlan + ' .need-approve').hide();
                $('.plan-' + tabSelected + ' .plan-' + dataPlan + ' .termsCheckBox input').attr('checked', 'checked');
            } else {
                $('.plan-' + tabSelected + ' .plan-' + dataPlan + ' .termsCheckBox input').removeAttr('checked');
            }
        }
    } else {
        if (fixedPlansHeader){
            if ($('#plans-header-fixed .terms-all .termsCheckBox input').prop('checked')) {
                $('#plans-header-fixed .need-approve').hide();
                //$('#plans-header-fixed .plan-price').not('.extra').css({'margin-bottom': '40px'})
                $('#plans-header-fixed .terms-all').css({'bottom': '78px'})
                $('#plans-header-fixed .terms-all .termsCheckBox input').attr('checked', 'checked');
            } else {
                $('#plans-header-fixed .terms-all .termsCheckBox input').removeAttr('checked');
            }
        } else {
            if ($('.plan-' + tabSelected + ' .terms-all .termsCheckBox input').prop('checked')) {
                $('.plan-' + tabSelected + ' .need-approve').hide();
                //$('.plan-' + tabSelected + ' .plan-price').not('.extra').css({'margin-bottom': '40px'});
                $('.plan-' + tabSelected + ' .terms-all').css({'bottom': '78px'});
                $('.plan-' + tabSelected + ' .terms-all .termsCheckBox input').attr('checked', 'checked');
            } else {
                $('.plan-' + tabSelected + ' .terms-all .termsCheckBox input').removeAttr('checked');
            }
        }
    }
})*/

/*$(document).on('click', '.button-pay', function(event){
    //fixedPlansHeader
    var dataPlan = $(this).attr("data-plan");
    var showDialog = $(this).attr("data-openDialog") || false;

    if(window.innerWidth>767 || dataPlan === 'personalCounselingHour' || dataPlan === 'checkRecommenders' || dataPlan === 'interviewSimulation'){
        if (fixedPlansHeader){
            if (!$('#plans-header-fixed .plan-' + dataPlan + ' .termsCheckBox input').prop('checked')) {
                event.preventDefault();
                $('#plans-header-fixed .plan-' + dataPlan + ' .need-approve').show();
            } else {
                if(showDialog){
                    showSpecialPlansDialog(dataPlan);
                }
            }
        } else {
            if (!$('.plan-' + tabSelected + ' .plan-' + dataPlan + ' .termsCheckBox input').prop('checked')) {
                event.preventDefault();
                $('.plan-' + tabSelected + ' .plan-' + dataPlan + ' .need-approve').show();
            } else {
                if(showDialog){
                    showSpecialPlansDialog(dataPlan);
                }
            }
        }
    } else {
        if (fixedPlansHeader){
            if (!$('#plans-header-fixed .terms-all .termsCheckBox input').prop('checked')) {
                event.preventDefault();
                $('#plans-header-fixed .terms-all .need-approve').show();
                //$('#plans-header-fixed .plan-price').css({'margin-bottom': '60px'})
                $('#plans-header-fixed .terms-all').css({'bottom': '102px'})
            } else {
                if(showDialog){
                    showSpecialPlansDialog(dataPlan);
                }
            }
        } else {
            if (!$('.plan-' + tabSelected + ' .terms-all .termsCheckBox input').prop('checked')) {
                event.preventDefault();
                $('.plan-' + tabSelected + ' .terms-all .need-approve').show();
                //$('.plan-' + tabSelected + " .plan-price").css({'margin-bottom': '60px'})
                $('.plan-' + tabSelected + " .terms-all").css({'bottom': '102px'})
            } else {
                if(showDialog){
                    showSpecialPlansDialog(dataPlan);
                }
            }
        }
    }
})

function showSpecialPlansDialog(dataPlan){
    $("#specialPlansDialog .spd").hide();
    $('#specialPlansDialog .spd-' + tabSelected).show();
    $('#specialPlansDialog').modal('show');
}*/

function createReadMoreButtons(){
    $(".servive-desc").removeClass("hidden-text")
    $(".service-desc-read-more").remove();

    $(".servive-desc").each(function() {
        if ($(this).height() > 40){
            $(this).addClass("hidden-text");
            $(this).after('<div class="service-desc-read-more">קרא עוד</div>');
        }
    });
}

function callGoogleScript(scriptType, params, onSuccess, onError) {
    window.event.preventDefault();

    var paramsToSend = {};
    if (params){
        paramsToSend = params
    }

    paramsToSend.scriptType = scriptType

    $.ajax({
        url : appScriptUrl,
        type: "POST",
        data : params,
        success: function(data, textStatus, jqXHR){
            return onSuccess(data, textStatus, jqXHR)
            //console.log({data, textStatus, jqXHR})
        },
        error: function (jqXHR, textStatus, errorThrown){
            return onError(jqXHR, textStatus, errorThrown)
            //console.log({jqXHR, textStatus, errorThrown})
        }
    });
}

function ConvertFormToJSON(form, jsonToAppend){
    var array = $(form).serializeArray();
    var json = jsonToAppend || {};
    
    $.each(array, function() {
        json[this.name] = this.value || '';
    });
    
    return json;
}

function capitalizeFirstLetter(string) {
    if (!string || !(typeof string === 'string' || string instanceof String) || !string.charAt(0)){
        return  ''
    }

    var returnValue = string.toLowerCase().trim()

    return returnValue.charAt(0).toUpperCase() + returnValue.slice(1);
}
})