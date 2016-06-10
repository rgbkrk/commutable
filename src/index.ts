import {
  fromJS as _fromJS,
  List,
  Map,
} from 'immutable';


import { cleanMultilineNotebook, makeMultilineNotebook } from './cleaning';
import { v4 as uuid } from 'uuid';
import { upgrade } from './convert';
/**
  * Exporting allows for functions inside the module to be accessed in the
  * global scope.
  * Quoting : https://www.typescriptlang.org/docs/release-notes/typescript-1.8.html
  * 'Neither module augmentations nor global augmentations can add new items
  * to the top level scope - they can only “patch” existing declarations.'
  */
export { upgrade };

/**
 * Creates a Map notebook representation from any given JSON representation
 * of a notebook.
 * @param {any} notebookJS - The notebook to be converted.
 * @return {Map<string, any>} The Map notebook representation in JSON.
 */
export function fromJS(notebookJS : any) {
  // TODO: Check the version of the notebook and convert it to the expected
  // version for in memory operations.
  const immnb = cleanMultilineNotebook(_fromJS(notebookJS));

  const cellData = {};
  return immnb
    .set('cellOrder', immnb.get('cells').map(cell => {
      const id = uuid();
      cellData[id] = cell;
      return id;
    }))
    .remove('cells')
    .set('cellMap', _fromJS(cellData));
}

/**
 * Creates an JSON representation of a notebook from the Map notebook
 * representation.
 * @param {Map<string, any>} notebook - A notebook in its Map representation.
 * @return {const} Notebook in its JSON.
 */
export function toJS(notebook : Map<string, any>) {
  return makeMultilineNotebook(notebook
    .set('cells', notebook
      .get('cellOrder', List<string>())
      .map(id =>
        notebook.getIn(['cellMap', id], _fromJS({}))
      )
    )
    .remove('cellOrder')
    .remove('cellMap'))
    .toJS();
}

/** Exports a Map representation of an empty Notebook from its JSON */
export const emptyNotebook = fromJS({
  cells: [],
  nbformat: 4,
  nbformat_minor: 0,
});

/** Exports a Map representation of a markdown cell from its JSON. */
export const emptyMarkdownCell = _fromJS({
  cell_type: 'markdown',
  metadata: {},
  source: '',
});

/** Exports a Map representation of an empty  code cell from its JSON. */
export const emptyCodeCell = _fromJS({
  cell_type: 'code',
  execution_count: null,
  metadata: {
    collapsed: false,
  },
  source: '',
  outputs: [],
});

/**
 * Inserts a cell into a Map notebook representation.
 * @param {Map<string, any>} notebook - The notebook in its Map representation that one wants to insert a cell into.
 * @param {Map<string, any>} cell - The Map JSON representation of a cell to be inserted.
 * @param {string} cellID - A Universally Unique Identifier given to cell to be inserted.
 * @param {number} index - The index of cellOrder List to insert UUID into, determining where cell will appear.
 * @return {Map<string, any>} The original notebook with the inserted cell.
 */
export function insertCellAt(notebook : Map<string, any>, cell : Map<string, any>, cellID : string, index : number) {
  return notebook.setIn(['cellMap', cellID], cell)
                 .set('cellOrder',
                  notebook.get('cellOrder').insert(index, cellID));
}

/**
 * Inserts a cell into a Map notebook representation given the previous cell.
 * @param {Map<string, any>} notebook - The notebook in its Map representation that one wants to insert a cell into.
 * @param {Map<string, any>} cell - The Map representation of a cell to be inserted.
 * @param {string} cellID - A Universally Unique Identifier given to cell to be inserted.
 * @param {string} priorCellID - The UUID of the cell that will precede the cell to be inserted.
 * @return {Map<string, any>} The original notebook with the inserted cell.
 */
export function insertCellAfter(notebook : Map<string, any>, cell : Map<string, any>, cellID : string, priorCellID : string) {
  return insertCellAt(notebook, cell, cellID, notebook.get('cellOrder').indexOf(priorCellID) + 1);
}

/**
 * Appends a cell to the end of the list of cells in a Map notebook representation.
 * @param {Map<string, any>} notebook - The notebook in its Map representation that one wants to append a cell to.
 * @param {Map<string, any>} cell - The Map representation of a cell to be inserted.
 * @param {string} cellID - A Universally Unique Identifier given to cell to be inserted,
 * it is generated by a call to uuid() upon calling the function.
 * @return {Map<string, any>} The original notebook with the inserted cell.
 */
export function appendCell(notebook : Map<string, any>, cell : Map<string, any>, cellID = uuid) {
  return notebook.setIn(['cellMap', cellID], cell)
                 .set('cellOrder',
                  notebook.get('cellOrder').push(cellID));
}

/**
 * Changes source to be executed by notebook to a given string.
 * @param {Map<string, any>} notebook - The notebook in its Map representation
 * that contains a cell with source desired to be changed.
 * @param {string} cellID - A Universally Unique Identifier given to cell to be modified.
 * @param {string} source - The source code or markdown to be given to a cell by the
 * function.
 * @return {Map<string, any>} The original notebook updated with the updated cell.
 */
export function updateSource(notebook : Map<string, any>, cellID : string, source : string) {
  return notebook.setIn(['cellMap', cellID, 'source'], source);
}

/**
 * Clears any output that an individual cell in a notebook has recorded.
 * @param  {Map<string, any>} notebook - The notebook in its Map representation
 * that contains a cell with output desired to be removed.
 * @param {string} cellID - A Universally Unique Identifier given to the cell to be modified.
 * @return {Map<string, any>} The original notebook with the output-removed cell.
 */
export function clearCellOutput(notebook : Map<string, any>, cellID : number) {
  return notebook.setIn(['cellMap', cellID, 'outputs'], List<any>());
}

/**
 * Updates output that an individual cell in a notebook has recorded with a
 * provided list of outputs.
 * @param  {Map<string, any>} notebook - The notebook in its Map representation that
 * contains a cell with output desired to be updated.
 * @param {string} cellID - A Universally Unique Identifier given to the cell to be modified.
 * @param {List<Map<string, any>>} outputs - List of key value pairs to be added
 * outputs list.
 * @return {Map<string, any>} The original notebook with the output-updated cell.
 */
export function updateOutputs(notebook : Map<string, any>, cellID : string, outputs : List<Map<string, any>>) {
  return notebook.setIn(['cellMap', cellID, 'outputs'], outputs);
}


/**
 * Updates number of times that an individual cell in a notebook has been executed
 * with a provided number.
 * @param  {Map<string, any>} notebook - The notebook in its Map representation
 * that contains a cell with execution count desired to be updated.
 * @param {string} cellID - A Universally Unique Identifier given to the cell to be modified.
 * @param {number} count - Number of the times the cell has been executed.
 * @return {Map<string, any>} The original notebook with the execution count updated cell.
 */
export function updateExecutionCount(notebook : Map<string, any>, cellID : string, count : number) {
  return notebook.setIn(['cellMap', cellID, 'execution_count'], count);
}

/**
 * Removes a cell from a given notebook given the UUID of the cell.
 * @param  {Map<string, any>} notebook - The notebook in its Map representation
 * that contains a cell that is to be removed.
 * @param {string} cellID - A Universally Unique Identifier given to the cell to be removed.
 * @return {Map<string, any>} The original notebook with the removed cell.
 */
export function removeCell(notebook : Map<string, any>, cellId : string) {
  return notebook
    .removeIn(['cellMap', cellId])
    .update('cellOrder', cellOrder => cellOrder.filterNot(id => id === cellId));
}

/**
 * Removes a cell from a given notebook given the index in the cellOrder.
 * @param  {Map<string, any>} notebook - the notebook in its Map representation
 * that contains a cell that is to be removed.
 * @param {number} index - The index of the cell in the cellOrder list such that
 * it can be removed.
 * @return {Map<string, any>} The original notebook with the removed cell.
 */
export function removeCellAt(notebook : Map<string, any>, index : number) {
  return removeCell(notebook, notebook.getIn(['cellOrder', index]));
}