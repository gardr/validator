var fs = require('fs');
var async = require('async');
var moment = require('moment');

var internals = {};

var REG_EXP_FILENAME = /^(\d+)x(\d+)_(\d+)/;

internals.getImages = function (harvested, output, next, options) {

    fs.readdir(options.outputDirectory, function (err, folder) {
        if (err) {
            return next(err);
        }
        var pathList = folder.map(function (filename) {
            return options.outputDirectory + '/' + filename;
        });
        async.map(pathList, fs.stat, function (err, results) {
            if (err){
                return next(err);
            }
            preprocess(folder, results);
        });
    });

    function preprocess(folder, results){
        // results is now an array of filesystem-stat-objects for each file,
        // with same index as in folder list
        function filterIsPngFile(file, i){
            return results[i].isFile() && file.indexOf('.png') > -1;
        }

        var images = folder.filter(filterIsPngFile).map(format);
        //add timing
        if (images.length > 0 && images[0]){
            var start = images[0].time;
            images.forEach(function(img){
                img.timing = img.time - start;
                var diff = moment(img.time).diff(harvested.common.startTime, 'seconds');
                img.formattedTiming = diff + ' sekund' + (diff > 1 ? 'er' : '');
            });
        }

        output('images', images);
        output('firstImage', images[0]);
        output('hasScreenshots', images && images.length > 0);
        next();
    }

    function format(filename, index, list) {
        var match = filename.match(REG_EXP_FILENAME);
        return {
            'active': index === (list.length - 1),
            'path': options.outputDirectory + '/' + filename,
            'filename': filename,
            'link': '/screenshots/'+options.id+'/'+filename,
            'index': index +1,
            'id': options.id,
            'total': list.length,
            'width': match && match[1]*1,
            'height': match && match[2]*1,
            'time': match && (match[3]*1),
            'formattedTime': match && moment(match[3]*1).format('HH:mm:ss.SS')
        };
    }
};

module.exports = {
    dependencies: ['screenshots'],
    preprocess: function (harvested, output, next, options) {
        if (harvested && options.outputDirectory) {
            internals.getImages.apply(this, Array.prototype.slice.call(arguments));
        } else {
            next();
        }
    }
};
