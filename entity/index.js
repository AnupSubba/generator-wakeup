'use strict';
var util = require('util'),
    path = require('path'),
    yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    _ = require('lodash'),
    _s = require('underscore.string'),
    shelljs = require('shelljs'),
    html = require("html-wiring"),
    entityBase = require('./entity-base');

var reservedWords_Java = ["ABSTRACT", "CONTINUE", "FOR", "NEW", "SWITCH", "ASSERT", "DEFAULT", "GOTO", "PACKAGE", "SYNCHRONIZED", "BOOLEAN", "DO", "IF", "PRIVATE", "THIS", "BREAK", "DOUBLE", "IMPLEMENTS", "PROTECTED", "THROW", "BYTE", "ELSE", "IMPORT", "PUBLIC", "THROWS", "CASE", "ENUM", "INSTANCEOF", "RETURN", "TRANSIENT", "CATCH", "EXTENDS", "INT", "SHORT", "TRY", "CHAR", "FINAL", "INTERFACE", "STATIC", "VOID", "CLASS", "FINALLY", "LONG", "STRICTFP", "VOLATILE", "CONST", "FLOAT", "NATIVE", "SUPER", "WHILE"];

var reservedWords_MySQL = ["ACCESSIBLE", "ADD", "ALL", "ALTER", "ANALYZE", "AND", "AS", "ASC", "ASENSITIVE", "BEFORE", "BETWEEN", "BIGINT", "BINARY", "BLOB", "BOTH", "BY", "CALL", "CASCADE", "CASE", "CHANGE", "CHAR", "CHARACTER", "CHECK", "COLLATE", "COLUMN", "CONDITION", "CONSTRAINT", "CONTINUE", "CONVERT", "CREATE", "CROSS", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP", "CURRENT_USER", "CURSOR", "DATABASE", "DATABASES", "DAY_HOUR", "DAY_MICROSECOND", "DAY_MINUTE", "DAY_SECOND", "DEC", "DECIMAL", "DECLARE", "DEFAULT", "DELAYED", "DELETE", "DESC", "DESCRIBE", "DETERMINISTIC", "DISTINCT", "DISTINCTROW", "DIV", "DOUBLE", "DROP", "DUAL", "EACH", "ELSE", "ELSEIF", "ENCLOSED", "ESCAPED", "EXISTS", "EXIT", "EXPLAIN", "FALSE", "FETCH", "FLOAT", "FLOAT4", "FLOAT8", "FOR", "FORCE", "FOREIGN", "FROM", "FULLTEXT", "GRANT", "GROUP", "HAVING", "HIGH_PRIORITY", "HOUR_MICROSECOND", "HOUR_MINUTE", "HOUR_SECOND", "IF", "IGNORE", "IN", "INDEX", "INFILE", "INNER", "INOUT", "INSENSITIVE", "INSERT", "INT", "INT1", "INT2", "INT3", "INT4", "INT8", "INTEGER", "INTERVAL", "INTO", "IS", "ITERATE", "JOIN", "KEY", "KEYS", "KILL", "LEADING", "LEAVE", "LEFT", "LIKE", "LIMIT", "LINEAR", "LINES", "LOAD", "LOCALTIME", "LOCALTIMESTAMP", "LOCK", "LONG", "LONGBLOB", "LONGTEXT", "LOOP", "LOW_PRIORITY", "MASTER_SSL_VERIFY_SERVER_CERT", "MATCH", "MAXVALUE", "MEDIUMBLOB", "MEDIUMINT", "MEDIUMTEXT", "MIDDLEINT", "MINUTE_MICROSECOND", "MINUTE_SECOND", "MOD", "MODIFIES", "NATURAL", "NOT", "NO_WRITE_TO_BINLOG", "NULL", "NUMERIC", "ON", "OPTIMIZE", "OPTION", "OPTIONALLY", "OR", "ORDER", "OUT", "OUTER", "OUTFILE", "PRECISION", "PRIMARY", "PROCEDURE", "PURGE", "RANGE", "READ", "READS", "READ_WRITE", "REAL", "REFERENCES", "REGEXP", "RELEASE", "RENAME", "REPEAT", "REPLACE", "REQUIRE", "RESIGNAL", "RESTRICT", "RETURN", "REVOKE", "RIGHT", "RLIKE", "SCHEMA", "SCHEMAS", "SECOND_MICROSECOND", "SELECT", "SENSITIVE", "SEPARATOR", "SET", "SHOW", "SIGNAL", "SMALLINT", "SPATIAL", "SPECIFIC", "SQL", "SQLEXCEPTION", "SQLSTATE", "SQLWARNING", "SQL_BIG_RESULT", "SQL_CALC_FOUND_ROWS", "SQL_SMALL_RESULT", "SSL", "STARTING", "STRAIGHT_JOIN", "TABLE", "TERMINATED", "THEN", "TINYBLOB", "TINYINT", "TINYTEXT", "TO", "TRAILING", "TRIGGER", "TRUE", "UNDO", "UNION", "UNIQUE", "UNLOCK", "UNSIGNED", "UPDATE", "USAGE", "USE", "USING", "UTC_DATE", "UTC_TIME", "UTC_TIMESTAMP", "VALUES", "VARBINARY", "VARCHAR", "VARCHARACTER", "VARYING", "WHEN", "WHERE", "WHILE", "WITH", "WRITE", "XOR", "YEAR_MONTH", "ZEROFILL", "GENERAL", "IGNORE_SERVER_IDS", "MASTER_HEARTBEAT_PERIOD", "MAXVALUE", "RESIGNAL", "SIGNAL", "SLOW"];


var EntityGenerator = module.exports = function EntityGenerator(args, options, config) {
    yeoman.generators.NamedBase.apply(this, arguments);
    this.useConfigurationFile =false;
    this.applicationName = this.config.get('applicationName');
    this.packageName = this.config.get('packageName');
    this.frameworkType = this.config.get('frameworkType');
    
    this.wakeupConfigDirectory = '.wakeup';
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
        console.log(chalk.red('The entity name cannot contain special characters'));
        throw new Error("Validation error");
    } else if (this.name == '') {
        console.log(chalk.red('The entity name cannot be empty'));
        throw new Error("Validation error");
    } else if (this.name.indexOf("Detail", this.name.length - "Detail".length) !== -1) {
        console.log(chalk.red('The entity name cannot end with \'Detail\''));
        throw new Error("Validation error");
    } else if (reservedWords_Java.indexOf(this.name.toUpperCase()) != -1) {
        console.log(chalk.red('The entity name cannot contain a Java reserved keyword'));
        throw new Error("Validation error");
    } else if (reservedWords_MySQL.indexOf(this.name.toUpperCase()) != -1) {
        console.log(chalk.red('The entity name cannot contain a MySQL reserved keyword'));
        throw new Error("Validation error");
    }

    console.log(chalk.blue('The entity ' + this.name + ' is being created.'));
    // Specific Entity sub-generator variables
    this.fieldId = 0;
    this.fields = [];
};

util.inherits(EntityGenerator, entityBase);

var fieldNamesUnderscored = ['id'];

EntityGenerator.prototype.askForFields = function askForFields() {
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
                } else if (reservedWords_MySQL.indexOf(input.toUpperCase()) != -1) {
                    return 'Your field name cannot contain a MySQL reserved keyword';
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

EntityGenerator.prototype.generateEntityJSON = function generateEntityJSON() {
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

    if (this.useConfigurationFile == false) { // store informations in a file for further use.
        this.data = {};
        this.data.fields = this.fields;
        this.write(this.filename, JSON.stringify(this.data, null, 4));
    } else {
        this.fields = this.fileData.fields;
        this.javadoc = this.fileData.javadoc;

        // Validate entity json field content
        for (var idx in this.fields) {
            var field = this.fields[idx];
            if (_.isUndefined(field.fieldId)) {
                console.log(chalk.red('ERROR fieldId is missing in .wakeup/' + this.name + '.json for field ' + JSON.stringify(field, null, 4)));
                process.exit(1);
            }

            if (_.isUndefined(field.fieldName)) {
                console.log(chalk.red('ERROR fieldName is missing in .wakeup/' + this.name + '.json for field with id ' + field.fieldId));
                process.exit(1);
            }

            if (_.isUndefined(field.fieldType)) {
                console.log(chalk.red('ERROR fieldType is missing in .wakeup/' + this.name + '.json for field with id ' + field.fieldId));
                process.exit(1);
            }
        }
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
    this.entityClass = _s.capitalize(this.name);
    this.entityInstance = _s.decapitalize(this.name);
    this.entityLowerCase = this.name.toLowerCase();
    this.entityTableName = _s.underscored(this.name).toLowerCase();
};

EntityGenerator.prototype.askForFramework = function askForFramework() {
    if(this.frameworkType == 'spring') {
        this.generateSpringEntity();
    }
}