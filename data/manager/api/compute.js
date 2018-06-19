/* globals api, math */
const compute = {};

const scope = {};

compute.init = () => {
  if (typeof math === 'undefined') {
    return api.require('venders/math.min.js').then(() => {
      math.import({
        plot: (ax, ay) => {
          if (ax) {
            ax = math.squeeze(ax);
          }
          if (ay) {
            ay = math.squeeze(ay);
          }
          if (ax && !ay) {
            ay = ax;
            ax = math.eval(`0:${ay._data.length - 1}`);
          }
          return {
            type: 'plot',
            x: ax._data,
            y: ay._data
          };
        },
        new: name => {
          api.emit('db.file', undefined, name);

          return 'creating a new SQLite database';
        },
        remove: id => {
          api.sql.close(id);
          api.tools.remove(id);

          return 'removing an existing SQLite database';
        },
        download: id => {
          api.sql.export(id, api.tools.name());

          return 'downloading a database';
        }
      }, scope);
      api.emit('math.init');
    });
  }
  return Promise.resolve();
};

compute.import = (name, aa) => compute.exec(`${name.trim()} = squeeze(${JSON.stringify(
  aa.map(a => a.values)
)})`);

compute.exec = exp => {
  const r = math.eval(exp, scope);
  return r.type ? r : math.format(r);
};

export default compute;
