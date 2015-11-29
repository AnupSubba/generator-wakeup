'use strict';
var util = require('util'),
    wakeupUtils = require('../util.js'),
    yeoman = require('yeoman-generator');

var Generator = module.exports = function Generator(args, options, config) {
    yeoman.generators.NamedBase.apply(this, arguments);
}

util.inherits(Generator, yeoman.generators.Base);
util.inherits(Generator, yeoman.generators.NamedBase);

Generator.prototype.addHtmlToIndex = function (script) {
    try {
        var fullPath = 'src/main/resources/public/index.html';
        wakeupUtils.rewriteFile({
            file: fullPath,
            needle: '<!-- add new entity here-->',
            splicable: [
                script
            ]
        });
    } catch (e) {
        console.log('\nUnable to find "src/main/resources/public/index.html" ');
    }
};

Generator.prototype.generateSpringEntity = function () {
    this.currentDT = new Date();
    this.template('spring/src/main/java/package/domain/Entity.java', 
                  'src/main/java/' + this.packageName + '/domain/' + this.entityClass + '.java' , this, {});
    this.template('spring/src/main/java/package/repository/EntityRepository.java', 
                  'src/main/java/' + this.packageName + '/repository/' + this.entityClass + 'Repository.java' , this, {});
    this.template('spring/src/main/java/package/rest/EntityRest.java', 
                  'src/main/java/' + this.packageName + '/rest/' + this.entityClass + 'Rest.java' , this, {});
    this.template('entity.html', 'src/main/resources/public/' + this.entityLowerCase + '.html' , this, {});
    this.addHtmlToIndex('<li><a href="' + this.entityLowerCase + '.html">' + this.entityClass + '</a></li>');
}
