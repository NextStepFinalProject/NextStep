
jQuery(document).ready(function ($) {

  $(function () {
    $('.faq-back-top').click(function () {
      $('body,html').animate({
        scrollTop: 0
      }, 800);
      return false;
    });
  });

});


jQuery().ready(function(){

    jQuery('.faq-category-list .faq-section-heading a, .faq-category-list .entry-title a').each( function () {
    
            var destination = '';

            jQuery( this ).click(function() {

                    var elementClicked = jQuery( this ).attr( 'href' );
                    var elementOffset = jQuery( 'body' ).find( elementClicked ).offset();
                    destination = elementOffset.top;

                    jQuery( 'html,body' ).animate({ scrollTop: destination - 30 }, 500 );

                    return false;
            });

    });

});

