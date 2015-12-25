'use strict';
var util = require('util'),
    chalk = require('chalk'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    shelljs = require('shelljs'),
    html = require("html-wiring"),
    yeoman = require('yeoman-generator');

var StubGenerator = module.exports = function StubGenerator(args, options, config) {
    yeoman.generators.NamedBase.apply(this, arguments);
}

var reservedWords_Java = ["ABSTRACT", "CONTINUE", "FOR", "NEW", "SWITCH", "ASSERT", "DEFAULT", "GOTO", "PACKAGE", "SYNCHRONIZED", "BOOLEAN", "DO", "IF", "PRIVATE", "THIS", "BREAK", "DOUBLE", "IMPLEMENTS", "PROTECTED", "THROW", "BYTE", "ELSE", "IMPORT", "PUBLIC", "THROWS", "CASE", "ENUM", "INSTANCEOF", "RETURN", "TRANSIENT", "CATCH", "EXTENDS", "INT", "SHORT", "TRY", "CHAR", "FINAL", "INTERFACE", "STATIC", "VOID", "CLASS", "FINALLY", "LONG", "STRICTFP", "VOLATILE", "CONST", "FLOAT", "NATIVE", "SUPER", "WHILE"];

var StubGenerator = module.exports = function StubGenerator(args, options, config) {
    yeoman.generators.NamedBase.apply(this, arguments);
    this.useConfigurationFile =false;
    
    this.wakeupConfigDirectory = '.wakeup/stub';
    this.name = this.name.replace('.json','');
    this.filename = this.wakeupConfigDirectory + '/' + _s.capitalize(this.name) + '.json';
    if (shelljs.test('-f', this.filename)) {
        console.log(chalk.green('Found the ' + this.filename + ' configuration file, automatically generating the entity'));
        try {
            this.fileData = JSON.parse(html.readFileAsString(this.filename))
        } catch (err) {
            console.log(chalk.red('The configuration file could not be read!'));
            return;
        }
        this.useConfigurationFile = true;
    }
    if (!(/^([a-zA-Z0-9_]*)$/.test(this.name))) {
        console.log(chalk.red('The stub name cannot contain special characters'));
        throw new Error("Validation error");
    } else if (this.name == '') {
        console.log(chalk.red('The stub name cannot be empty'));
        throw new Error("Validation error");
    } else if (this.name.indexOf("Detail", this.name.length - "Detail".length) !== -1) {
        console.log(chalk.red('The stub name cannot end with \'Detail\''));
        throw new Error("Validation error");
    } else if (reservedWords_Java.indexOf(this.name.toUpperCase()) != -1) {
        console.log(chalk.red('The stub name cannot contain a Java reserved keyword'));
        throw new Error("Validation error");
    }

    console.log(chalk.blue('The entity ' + this.name + ' is being created.'));
    // Specific Stub sub-generator variables
    this.fieldId = 0;
    this.fields = [];
};

util.inherits(StubGenerator, yeoman.generators.Base);
util.inherits(StubGenerator, yeoman.generators.NamedBase);

var fieldNamesUnderscored = ['id'];

StubGenerator.prototype.askForFields = function askForFields() {
    if (this.useConfigurationFile == true) {// don't prompt if data are imported from a file
        return;
    }
    var cb = this.async();
    this.fieldId++;
    console.log(chalk.green('Generating field #' + this.fieldId));
    var prompts = [
        {
            type: 'confirm',
            name: 'fieldAdd',
            message: 'Do you want to add a field to your entity?',
            default: true
        },
        {
            when: function (response) {
                return response.fieldAdd == true;
            },
            type: 'input',
            name: 'fieldName',
            validate: function (input) {
                if (!(/^([a-zA-Z0-9_]*)$/.test(input))) {
                    return 'Your field name cannot contain special characters';
                } else if (input == '') {
                    return 'Your field name cannot be empty';
                } else if (input.charAt(0) == input.charAt(0).toUpperCase()) {
                    return 'Your field name cannot start with a upper case letter';
                } else if (input == 'id' || fieldNamesUnderscored.indexOf(_s.underscored(input)) != -1) {
                    return 'Your field name cannot use an already existing field name';
                } else if (reservedWords_Java.indexOf(input.toUpperCase()) != -1) {
                    return 'Your field name cannot contain a Java reserved keyword';
                } else if (input.length > 30) {
                    return 'The field name cannot be of more than 30 characters';
                }
                return true;
            },
            message: 'What is the name of your field?'
        },
        {
            when: function (response) {
                return response.fieldAdd == true;
            },
            type: 'list',
            name: 'fieldType',
            message: 'What is the type of your field?',
            choices: [
                {
                    value: 'String',
                    name: 'String'
                },
                {
                    value: 'Integer',
                    name: 'Integer'
                },
                {
                    value: 'Float',
                    name: 'Float'
                },
                {
                    value: 'Double',
                    name: 'Double'
                },
                {
                    value: 'Double',
                    name: 'Double'
                },
                {
                    value: 'Boolean',
                    name: 'Boolean'
                }
            ],
            default: 0
        }
    ];
    this.prompt(prompts, function (props) {
        if (props.fieldAdd) {
            var field = {
                fieldId: this.fieldId,
                fieldName: props.fieldName,
                fieldType: props.fieldType
            };
            fieldNamesUnderscored.push(_s.underscored(props.fieldName));
            this.fields.push(field);
        }
        console.log(chalk.red('=================' + _s.capitalize(this.name) + '================='));
        if (props.fieldAdd) {
            this.askForFields();
        } else {
            cb();
        }
    }.bind(this));
};

StubGenerator.prototype.askForMethods = function askForMethods() {
    if (this.useConfigurationFile == true) { // don't prompt if data are imported from a file
        return;
    }
    var cb = this.async();
    var prompts = [
        {
            type: 'list',
            name: 'isPublic',
            message: 'Do you want to use public fields?',
            choices: [
                {
                    value: 'no',
                    name: 'No, dont use public fields'
                },
                {
                    value: 'yes',
                    name: 'Yes, use public fields'
                }
            ],
            default: 0
        },
        {
            type: 'list',
            name: 'methods',
            message: 'Do you want to use all methods?',
            choices: [
                {
                    value: 'yes',
                    name: 'Yes, use all methods'
                },
                {
                    value: 'no',
                    name: 'No, Want to select methods'
                }
            ],
            default: 0
        },
        {
            when: function (response) { return response.methods == 'no'; },
            type: 'checkbox',
            name: 'methodsType',
            message: 'Which methods do you want to add?',
            choices: [
                {name: 'ToString', value: 'tostring'},
                {name: 'Builder', value: 'builder'}
            ],
            default: 0
        }
    ];
    this.prompt(prompts, function (props) {
        this.methods = props.methods;
        this.isPublic = props.isPublic;
        this.methodsType = props.methodsType;
        cb();
    }.bind(this));
};

StubGenerator.prototype.generateEntityJSON = function generateEntityJSON() {
    // Expose utility methods in templates
    this.util = {};
    this.util.contains = _.contains;
    var wordwrap = function(text, width){
        var wrappedText = '';
        var rows = text.split('\n');
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            wrappedText = wrappedText + '\n' + _s.wrap(row, { width: width });
        }
        return wrappedText;
    }
    var wordwrapWidth = 80;
    this.util.formatAsClassJavadoc = function (text) {
        return '/**' + wordwrap(text, wordwrapWidth - 4).replace(/\n/g, '\n * ') + '\n */';
    };
    this.util.formatAsFieldJavadoc = function (text) {
        return '    /**' + wordwrap(text, wordwrapWidth - 8).replace(/\n/g, '\n     * ') + '\n     */';
    };

    if (this.useConfigurationFile == false) { // store information in a file for further use.
        this.data = {};
        this.data.fields = this.fields;
        this.data.isPublic = this.isPublic;
        this.data.methods = this.methods;
        this.data.methodsType = this.methodsType;
        this.write(this.filename, JSON.stringify(this.data, null, 4));
    } else {
        this.isPublic = this.fileData.isPublic;
        this.methods = this.fileData.methods;
        this.methodsType = this.fileData.methodsType;
        this.fields = this.fileData.fields;

        // Validate entity json field content
        for (var idx in this.fields) {
            var field = this.fields[idx];
            if (_.isUndefined(field.fieldId)) {
                console.log(chalk.red('ERROR fieldId is missing in .wakeup/stub/' + this.name + '.json for field ' + JSON.stringify(field, null, 4)));
                process.exit(1);
            }

            if (_.isUndefined(field.fieldName)) {
                console.log(chalk.red('ERROR fieldName is missing in .wakeup/stub/' + this.name + '.json for field with id ' + field.fieldId));
                process.exit(1);
            }

            if (_.isUndefined(field.fieldType)) {
                console.log(chalk.red('ERROR fieldType is missing in .wakeup/stub/' + this.name + '.json for field with id ' + field.fieldId));
                process.exit(1);
            }
        }
    }
    
    // Load in-memory data
    this.isToString = false;
    this.isBuilder = false;
    if(_.contains(this.methodsType, 'tostring') || this.methods == 'yes') {
        this.isToString = true;
    }
    if(_.contains(this.methodsType, 'builder') || this.methods == 'yes') {
        this.isBuilder = true;
    }

    // Load in-memory data for fields
    for (var idx in this.fields) {
        var field = this.fields[idx];

        if (_.isUndefined(field.fieldNameCapitalized)) {
            field.fieldNameCapitalized = _s.capitalize(field.fieldName);
        }

        if (_.isUndefined(field.fieldNameUnderscored)) {
            field.fieldNameUnderscored = _s.underscored(field.fieldName);
        }

        if (_.isUndefined(field.fieldInJavaBeanMethod)) {
            // Handle the specific case when the second letter is capitalized
            // See http://stackoverflow.com/questions/2948083/naming-convention-for-getters-setters-in-java
            if (field.fieldName.length > 1) {
                var firstLetter = field.fieldName.charAt(0);
                var secondLetter = field.fieldName.charAt(1);
                if (firstLetter == firstLetter.toLowerCase() && secondLetter == secondLetter.toUpperCase()) {
                    field.fieldInJavaBeanMethod = firstLetter.toLowerCase() + field.fieldName.slice(1);
                } else {
                    field.fieldInJavaBeanMethod = _s.capitalize(field.fieldName);
                }
            } else {
                field.fieldInJavaBeanMethod = _s.capitalize(field.fieldName);
            }
        }
    }
    this.stubClass = _s.capitalize(this.name);
    this.stubInstance = _s.decapitalize(this.name);
};

StubGenerator.prototype.getnerateStub = function getnerateStub() {
    this.currentDT = new Date();
    this.template('Stub.java', 'stub/' + this.stubClass + '.java' , this, {});
}