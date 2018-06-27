/* globals api */
const box = {
  active: null
};

const root = document.getElementById('box');
root.addEventListener('click', e => {
  if (e.target.tagName === 'TD') {
    const tr = e.target.closest('tr');
    tr.dataset.selected = tr.dataset.selected !== 'true';
  }
});
const viewer = document.getElementById('viewer');
viewer.addEventListener('click', ({target}) => {
  const x = viewer.scrollLeft;
  const y = viewer.scrollTop;
  if (target === viewer) {
    box.active.focus();
    return viewer.scrollTo(x, y);
  }
  else {
    const div = target.closest('[data-id="command-box"]');
    if (div && window.getSelection().toString() === '') {
      div.querySelector('textarea').focus();
      viewer.scrollTo(x, y);
    }
  }
});

const keys = [
  'ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ANALYZE',
  'AND', 'AS', 'ASC', 'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN',
  'BETWEEN', 'BY', 'CASCADE', 'CASE', 'CAST', 'CHECK', 'COLLATE', 'COLUMN',
  'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT_DATE',
  'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE', 'DEFAULT', 'DEFERRABLE',
  'DEFERRED', 'DELETE', 'DESC', 'DETACH', 'DISTINCT', 'DROP', 'EACH', 'ELSE',
  'END', 'ESCAPE', 'EXCEPT', 'EXCLUSIVE', 'EXISTS', 'EXPLAIN', 'FAIL', 'FOR',
  'FOREIGN', 'FROM', 'FULL', 'GLOB', 'GROUP', 'HAVING', 'IF', 'IGNORE',
  'IMMEDIATE', 'IN', 'INDEX', 'INDEXED', 'INITIALLY', 'INNER', 'INSERT',
  'INSTEAD', 'INTERSECT', 'INTO', 'IS', 'ISNULL', 'JOIN', 'KEY', 'LEFT',
  'LIKE', 'LIMIT', 'MATCH', 'NATURAL', 'NO', 'NOT', 'NOTNULL', 'NULL', 'OF',
  'OFFSET', 'ON', 'OR', 'ORDER', 'OUTER', 'PLAN', 'PRAGMA', 'PRIMARY', 'QUERY',
  'RAISE', 'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX', 'RELEASE', 'RENAME',
  'REPLACE', 'RESTRICT', 'RIGHT', 'ROLLBACK', 'ROW', 'SAVEPOINT', 'SELECT', 'SET',
  'TABLE', 'TEMP', 'TEMPORARY', 'THEN', 'TO', 'TRANSACTION', 'TRIGGER', 'UNION',
  'UNIQUE', 'UPDATE', 'USING', 'VACUUM', 'VALUES', 'VIEW', 'VIRTUAL', 'WHEN',
  'WHERE', 'WITH', 'WITHOUT'
];
const isSQL = cmd => {
  return keys.indexOf(cmd.trim().split(' ')[0].toUpperCase()) !== -1;
};

box.add = () => {
  const t = document.getElementById('command-box');
  const clone = document.importNode(t.content, true);
  const div = clone.querySelector('[data-id="command-box"]');
  const result = clone.querySelector('[data-id=result]');
  const input = clone.querySelector('textarea');

  // RESIZE
  const resize = () => {
    input.style.height = '20px';
    input.style.height = input.scrollHeight + 'px';
    input.scrollIntoViewIfNeeded();
  };
  const autocompete = () => {
    const v = input.value.substr(0, input.selectionStart).split(' ').pop();
    if (v.length > 2) {
      const m = keys.filter(n => n.startsWith(v.toUpperCase())).shift();
      if (m) {
        const s = input.selectionStart;
        let suggest = m.substr(v.length);
        if (v === v.toLowerCase()) {
          suggest = suggest.toLowerCase();
        }
        document.execCommand('insertText', null, suggest);
        input.selectionStart = s;
        input.selectionEnd = s + m.length - v.length;

      }
    }
  }
  input.addEventListener('keyup', () => {
    resize();
    // autocompete();
  });
  input.addEventListener('input', resize);
  input.addEventListener('paste', resize);
  input.addEventListener('keydown', e => {
    const {target, key} = e;
    // switch to next or previous boxes
    if (target.selectionStart === target.selectionEnd && ['ArrowUp', 'ArrowDown'].indexOf(key) !== -1) {
      // switch to the previous box
      if (key === 'ArrowUp' && target.selectionStart === 0) {
        const p = div.previousElementSibling;
        if (p && p.dataset.id === 'command-box') {
          p.querySelector('textarea').focus();
        }
      }
      // switch to the next box
      else if (key === 'ArrowDown' && target.selectionStart === target.value.length) {
        const p = div.nextElementSibling;
        if (p && p.dataset.id === 'command-box') {
          p.querySelector('textarea').focus();
        }
      }
    }
  });
  input.addEventListener('keypress', e => {
    // dealing with Enter
    if (e.key === 'Enter' && e.shiftKey === false && input.value.trim()) {
      e.preventDefault();
      const next = div.nextElementSibling;
      if (next) {
        next.querySelector('textarea').focus();
      }
      else {
        box.add();
      }
      result.textContent = '';
      delete result.dataset.type;

      api.emit(isSQL(input.value) ? 'execute.sql' : 'execute.math', {
        cmd: input.value,
        result
      });
    }
  });
  input.addEventListener('focus', e => box.active = e.target);
  root.appendChild(clone);
  input.focus();
  resize();
  window.setTimeout(() => result.scrollIntoView());
  box.active = input;
};

box.table = ({columns, values}, parent) => {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  {
    const tr = document.createElement('tr');
    ['#', ...columns].forEach(name => {
      const th = document.createElement('th');
      th.textContent = name;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  }
  const tbody = document.createElement('tbody');
  values.forEach((row, i) => {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    [i, ...row].forEach(name => {
      const td = document.createElement('td');
      td.textContent = name;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  parent.appendChild(table);
};

// https://gist.githubusercontent.com/hsablonniere/2581101/raw/3634e38ed9393bf0ae987ce9318f11eefca12020/index.js
if (!Element.prototype.scrollIntoViewIfNeeded) {
  Element.prototype.scrollIntoViewIfNeeded = function (centerIfNeeded) {
    centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

    var parent = this.parentNode,
        parentComputedStyle = window.getComputedStyle(parent, null),
        parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width')),
        parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width')),
        overTop = this.offsetTop - parent.offsetTop < parent.scrollTop,
        overBottom = (this.offsetTop - parent.offsetTop + this.clientHeight - parentBorderTopWidth) > (parent.scrollTop + parent.clientHeight),
        overLeft = this.offsetLeft - parent.offsetLeft < parent.scrollLeft,
        overRight = (this.offsetLeft - parent.offsetLeft + this.clientWidth - parentBorderLeftWidth) > (parent.scrollLeft + parent.clientWidth),
        alignWithTop = overTop && !overBottom;

    if ((overTop || overBottom) && centerIfNeeded) {
      parent.scrollTop = this.offsetTop - parent.offsetTop - parent.clientHeight / 2 - parentBorderTopWidth + this.clientHeight / 2;
    }

    if ((overLeft || overRight) && centerIfNeeded) {
      parent.scrollLeft = this.offsetLeft - parent.offsetLeft - parent.clientWidth / 2 - parentBorderLeftWidth + this.clientWidth / 2;
    }

    if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
      this.scrollIntoView(alignWithTop);
    }
  };
}

export default box;
