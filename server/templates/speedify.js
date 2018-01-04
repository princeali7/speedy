




let cfh= `




<!-- Boosted Plus Package Code Start -->
{% assign content_header=""%}
{%assign content_header= cfh | split: 'var urls = ["' | first %}
{%assign cfhsplitUrls= cfh | split: 'var urls = ["' | last %}

{%assign cfhsplit= cfhsplitUrls | split: '"];' | first %}

{%assign content_header_last= cfhsplitUrls | split: '"];' | last %}
{% assign content_header_final= content_header |append: 'var urls=[];' | append : content_header_last %}

{%assign scripts= cfhsplit | split: '","'  %}
 
 


<!--- Shopify Base Scripts Start -->
{{content_header_final}}
<!-- Shopify Base Scripts End -->

<!--- Async Apps Loading after page load start -->
{% for scripturl in scripts %}
<noscript type="text/javascript/defer" src="{{scripturl | replace : '\\/' ,'/' | replace : '\u0026' ,'&'}}" defer ></noscript>


{% endfor %}

<!--- Async Apps Loading after page load end -->

<script>
      String.prototype.includes = function (str) {
  var returnValue = false;

  if (this.indexOf(str) !== -1) {
    returnValue = true;
  }

  return returnValue;
}

		function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};


     var loadDeferredStyles = function() {
        console.warn('deferred Styles Loaded');
        var addStylesNode = document.getElementById("deferred-styles");
        var replacement = document.createElement("div");
        if(addStylesNode){
        replacement.innerHTML = addStylesNode.textContent;
        document.body.appendChild(replacement);
        addStylesNode.parentElement.removeChild(addStylesNode);
        }


        //setTimeout(function(){loadDeferredscripts();},3000);
      };
     var loadDeferredscripts = function() {
        console.warn('loading scripts');

     $('[type="text/javascript/defer"]').each(function(){


                 if(jQuery(this).attr('src')){
              var ss = document.createElement("script");
              ss.src = jQuery(this).attr('src');
              ss.type = "text/javascript";
              ss.defer= true;
			        ss.async=true;
      if(jQuery(this).attr('onload')){
                      jQuery(ss).attr('onload',jQuery(this).attr('onload'));
                      }     

             document.getElementsByTagName("head")[0].appendChild(ss);
                 }
          });
     $('[type="text/javascript/inlinedefer"]').each(function(){

        window.eval(this.innerHTML);

     });


      }
	    window.islazyloaded=false;
      	window.islazyloadstyle=false;
          function l_lazyLoop(){

        if(window.lazySizes){
    		lazySizes.init();
        }else{
        setTimeout(function(){
        l_lazyLoop();
        },100);
        }
      }



       var loadscriptsz= debounce(function (){
          if(!window.islazyload)
          {
            window.islazyload=true;
            loadDeferredscripts();loadDeferredStyles();
       //l_lazyLoop();

          }
        },500);



        window.onmousemove=function(){
         loadscriptsz();
        };
        window.ontouchstart=function(){
          loadscriptsz();
        };
        window.onmouseover=function(){
          loadscriptsz();
        };

        var raf = requestAnimationFrame || mozRequestAnimationFrame ||
          webkitRequestAnimationFrame || msRequestAnimationFrame;
      if (raf) raf(function() { window.setTimeout(loadDeferredStyles, 0); });





    </script>

`;

let customcss = `
<style>



</style>
`;

let jQuery= `
    <script>
    
    
</script>

`;

let template = {
    customcss:customcss,
    cfhOptimized:cfh,
    jquery: jQuery

};


module.exports= template;