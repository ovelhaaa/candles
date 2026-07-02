const fs = require('fs');

let propsCode = fs.readFileSync('src/components/PropertiesPanel.tsx', 'utf8');

// We need to inject string parameter rendering.
// Right before:            {param.type === 'matrix' ? (
const strProps = `            {param.type === 'string' ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{param.label || key}</label>
                <input
                   type="text"
                   value={param.value}
                   onChange={(e) => handleParamChange(key, e.target.value)}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono outline-none focus:border-blue-500"
                />
              </div>
            ) : param.type === 'matrix' ? (`;

propsCode = propsCode.replace("{param.type === 'matrix' ? (", strProps);

// Same for macro params block
const strPropsMacro = `                       {subParam.type === 'string' ? (
                         <div className="space-y-2">
                           <div className="flex justify-between items-center pb-1">
                             <label className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{subParam.label || subKey}</label>
                           </div>
                           <input
                             type="text"
                             value={subParam.value}
                             onChange={(e) => {
                               const newParams = { ...params };
                               newParams[key] = { ...newParams[key] };
                               newParams[key][subKey] = { ...subParam, value: e.target.value };
                               updateNodeData(selectedNode.id, { params: newParams });
                             }}
                             className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono outline-none focus:border-blue-500"
                           />
                         </div>
                       ) : subParam.type === 'matrix' ? (`;

propsCode = propsCode.replace("{subParam.type === 'matrix' ? (", strPropsMacro);

fs.writeFileSync('src/components/PropertiesPanel.tsx', propsCode);


let nodeTypes = fs.readFileSync('src/config/nodeTypes.ts', 'utf8');
const newTypes = `
  knob: {
    type: 'knob',
    label: 'Macro Knob',
    description: 'Outputs a constant CV value. Use to control multiple parameters at once.',
    params: {
      value: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Value' },
      minVal: { value: 0, min: -1000, max: 1000, step: 0.1, label: 'Min Output' },
      maxVal: { value: 1, min: -1000, max: 1000, step: 0.1, label: 'Max Output' },
    },
    inputs: 0,
    outputs: 1,
  },
  math: {
    type: 'math',
    label: 'Math Expression',
    description: 'Evaluates a mathematical expression. Inputs mapped to variables a, b, c, d.',
    params: {
      expression: { type: 'string', value: 'a + b', label: 'Expression' }
    },
    inputs: 4,
    outputs: 1,
  },
`;
nodeTypes = nodeTypes.replace('export const NODE_TYPES = {', 'export const NODE_TYPES = {' + newTypes);
fs.writeFileSync('src/config/nodeTypes.ts', nodeTypes);


let dspCode = fs.readFileSync('src/components/nodes/DSPNode.tsx', 'utf8');

const stringParamRender = `
                {paramsToRender.filter(p => p.type === 'string').map(p => (
                  <div key={p.id} className="flex flex-col gap-1 nodrag cursor-auto" onClick={e => e.stopPropagation()}>
                    <span className="truncate mr-2 text-[10px] uppercase text-slate-500">{p.label}</span>
                    <input 
                      type="text" 
                      value={p.value}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-emerald-400 font-mono nodrag"
                      onChange={(e) => {
                         const val = e.target.value;
                         if (data.type === 'macro') {
                           const [nodeId, paramId] = p.id.split('_');
                           useStore.getState().updateNodeData(id, {
                             params: { ...data.params, [nodeId]: { ...data.params[nodeId], [paramId]: { ...data.params[nodeId][paramId], value: val } } }
                           });
                         } else {
                           useStore.getState().updateNodeData(id, {
                             params: { ...data.params, [p.id]: { ...data.params[p.id], value: val } }
                           });
                         }
                      }}
                    />
                  </div>
                ))}
`;

// Insert it right after the matrix render map block
dspCode = dspCode.replace(
  `                  </div>\n                ))}\n                \n                {paramsToRender.length > 4`,
  `                  </div>\n                ))}\n${stringParamRender}\n                {paramsToRender.length > 4`
);

// We need to exclude 'string' type from the slider lists.
// Change `p => p.type !== 'matrix'` to `p => p.type !== 'matrix' && p.type !== 'string'`
dspCode = dspCode.replaceAll(`p.type !== 'matrix'`, `p.type !== 'matrix' && p.type !== 'string'`);

fs.writeFileSync('src/components/nodes/DSPNode.tsx', dspCode);

