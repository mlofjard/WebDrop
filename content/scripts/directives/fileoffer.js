angular.module('webdrop.directives.fileoffer', [])
  .directive('fileOffer', [function() {
    return {
      scope: false,
      link: function (scope, el, attrs) {
        var offeredFiles = scope[attrs.fileOffer];
        var chunkSize = 800;

        function getChunks(fileData) {
          var result = [];
          var numberOfChunks = Math.ceil(fileData.length / chunkSize);
          console.log('Number of chunks: ' + numberOfChunks);

          for(var i = 0; i < numberOfChunks; i++) {
            result.push(fileData.substring(i * chunkSize, i * chunkSize + chunkSize));
          }

          return result;
        }

        el.bind('change', function(event){
          var files = event.target.files;
          var file = files[0];
          if (file) {
            var reader = new FileReader();
            reader.onload = function(e) {
              var chunks = getChunks(e.target.result);

              offeredFiles[file.name] = { name: file.name, size: file.size, chunks: chunks };
              scope.$apply();
            };
            reader.readAsDataURL(file);
          }
        });
      }
    };
  }]);