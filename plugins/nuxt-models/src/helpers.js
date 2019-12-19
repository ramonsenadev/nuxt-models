const LOGS = false // process.env.NODE_ENV !== 'production'

/**
 * Model class
 */
class Model {
  update (data) {
    if (LOGS) {
      console.log('Update model values.', data)
    }
    _setValues(this, this.model, data)
    return this
  }

  reset () {
    if (LOGS) {
      console.log('Reset model values.')
    }
    _setValues(this, this.model)
    return this
  }
}

/**
 * Require helper
 * @param filename {string}
 * @returns {object}
 * @private
 */
export function _require (filename) {
  let model = {}
  try {
    model = require('@/models/' + filename + '.js').default
  } catch (e) {
    console.warn(`Cannot find model "${filename}" in /modules directory.`)
  }
  return model
}

/**
 * Create new entity helper
 * @param name {string}
 * @param model {object}
 * @param data {object}
 * @returns {object}
 * @private
 */
export function _new (name, model, data = {}) {
  const Entity = new Model()

  // Set initial entity values
  _setValues(Entity, model, data)

  // Original model
  Object.defineProperty(Entity, 'model', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: model
  })

  // Model name
  Object.defineProperty(Entity, 'modelName', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: name
  })

  // Validation status
  Object.defineProperty(Entity, 'validation', {
    get () {
      return _checkValidation(Entity)
    }
  })

  return Entity
}

/**
 * Set entity values
 * @param entity
 * @param model
 * @param data
 * @private
 */
function _setValues (entity, model, data = {}) {
  Object.keys(model).forEach(key => {
    let value

    if (!model[key].type) {
      model[key] = {
        type: model[key]
      }
    }

    if (Object.keys(data).includes(key)) {
      // Get value from initial data
      value = data[key]
    } else if (Object.keys(model[key]).includes('default')) {
      // Get value from default option
      value = typeof model[key].default === 'function' ? model[key].default() : model[key].default
    } else {
      // Generate empty value by type
      value = _generateValueByType(model[key])
    }

    if (Object.keys(model[key]).includes('validation')) {
      // Validate value
      if (!model[key].validation(value)) {
        console.warn(`Unable to set "${value}" value. Check model validation.`)
        // Generate empty value by type
        value = entity[key] || _generateValueByType(model[key])
      }
      // Create getter/setter for option
      Object.defineProperty(entity, `_${key}`, {
        configurable: true,
        enumerable: false,
        writable: true,
        value
      })
      Object.defineProperty(entity, key, {
        configurable: true,
        enumerable: true,
        get () {
          return this[`_${key}`]
        },
        set (value) {
          if (!this.model[key].validation(value)) {
            console.warn(`Unable to set "${value}" value. Check model validation.`)
            return this[key]
          }
          this[`_${key}`] = value
        }
      })
    } else {
      entity[key] = value
    }
  })
}

/**
 * Check entity validation helper
 * @param entity
 * @returns {boolean}
 * @private
 */
export function _checkValidation (entity) {
  let validated = true
  Object.keys(entity).every(key => {
    if (entity.model[key].required && !entity[key]) {
      validated = false
      return false
    }
    return true
  })
  return validated
}

/**
 * Generate value by option type helper
 * @param option
 * @returns {Object}
 * @private
 */
export function _generateValueByType (option) {
  // eslint-disable-next-line new-cap
  return new option.type().valueOf()
}

export default {
  _require,
  _new,
  _setValues,
  _checkValidation,
  _generateValueByType
}