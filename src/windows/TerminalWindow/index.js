import React, { useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Window } from 'components';
import { classes } from 'common/utils';
import { FileSystemContext, ResponsiveContext } from 'contexts';
import { Child, Dir, File, SystemDir } from 'beans';
import { bio } from 'data';
import './stylesheet.scss';

let sourceCode;
fetch('https://raw.githubusercontent.com/64json/64json.github.io/b66992d893f311e309df025611e3a400a5dcffb2/script.js')
  .then(response => {
    if (!response.ok) {
      throw new Error('Error occurred while loading source code: ' + response.statusText);
    }
    return response.text();
  })
  .then(value => sourceCode = value)
  .catch(console.error);

function TerminalWindow(props) {
  const { onUpdate } = props;
  const mobile = useContext(ResponsiveContext);
  const [rootDir, refreshRootDir] = useContext(FileSystemContext);
  const history = useHistory();

  const [currentPathKeys, setCurrentPathKeys] = useState(['users', 'jason', 'desktop']);

  const getPrompt = () => {
    const pathKeys = [...currentPathKeys];
    if (['users', 'jason'].every((v, i) => v === pathKeys[i])) {
      pathKeys.splice(0, 2, '~');
    }
    const path = pathKeys.join('/') || '/';
    return `jason@world:${path}$ `;
  };

  const [inputHistory, setInputHistory] = useState([]);
  const [inputHistoryIndex, setInputHistoryIndex] = useState(0);
  const [tabPressed, setTabPressed] = useState(false);
  const [hackertyperLength, setHackertyperLength] = useState(null);
  const [text, setText] = useState('');
  const [inputs, setInputs] = useState(['']);
  const [cursorIndex, setCursorIndex] = useState(0);
  const isHackertyper = hackertyperLength !== null;

  const cursorRef = useRef(null);

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView();
    }
  }, [hackertyperLength, text, inputs]);

  const flush = () => print('', { newLine: false });

  const print = (append, { flush = true, resetInput = true, newLine = true, wordBreak = false } = {}) => {
    const newText = text +
      (flush ? `${getPrompt()}${inputs.join('')}\n` : '') +
      (wordBreak ? '<span class="word-break">' : '') +
      (Array.isArray(append) ? append.join('\n') : append)
        .replace(/{(.+)}/g, '<span class="underline">$1</span>&nbsp;&nbsp;')
        .replace(/\*(.+)\*/g, '<span class="highlight">$1</span>') +
      (newLine ? '\n' : '') +
      (wordBreak ? '</span>' : '');
    setText(newText);
    if (resetInput) {
      setInputs(['']);
      setCursorIndex(0);
    }
  };

  const getPathKeys = path => {
    const tokens = path ? path.split('/') : [];
    let pathKeys = [...currentPathKeys];
    if (tokens[0] === '') {
      pathKeys = [];
      tokens.shift();
    } else if (tokens[0] === '~') {
      pathKeys = ['users', 'jason'];
      tokens.shift();
    }
    for (const token of tokens) {
      switch (token) {
        case '':
        case '.':
          break;
        case '..':
          pathKeys.pop();
          break;
        default:
          pathKeys.push(token);
          break;
      }
    }
    return pathKeys;
  };

  const processCommand = input => {
    const [command, ...args] = input.split(/\s+/);
    const pathArgs = args.filter(arg => !arg.startsWith('-')); // TODO: wildcard selector
    const optionArg = args.find(arg => arg.startsWith('-'));
    const options = optionArg ? optionArg.substring(1).split('') : [];
    switch (command) {
      case '': {
        flush();
        break;
      }
      case 'help': {
        print([
          ' *help*            show all the possible commands',
          ` *whoami* [-j]     display information about ${bio.first_name}`,
          ' *cd* {dir}        change the working directory',
          ' *ls* {dir}        list directory contents',
          ' *pwd*             return the working directory',
          ' *rm* [-fr] {dir}  remove directory entries',
          ' *open* {files}    open the files',
          ' *clear*           clear the terminal screen',
          ' *exit*            close the terminal window',
          ' *hackertyper*     ?????',
          // TODO: add node interpreter
          // TODO: add touch
          // TODO: add mkdir
          // TODO: add vim
        ]);
        break;
      }
      case 'whoami': {
        if (options.includes('j')) {
          window.open('https://www.instagram.com/64jinseo/');
          flush();
        } else {
          print([
            `*${bio.full_name}* (${bio.alias})`,
            bio.description,
            'Type "*whoami -j*" to show some snapshots of his journey.',
          ], { wordBreak: true });
        }
        break;
      }
      case 'cd': {
        const pathArg = pathArgs.shift();
        const pathKeys = getPathKeys(pathArg);
        const child = rootDir.getChild(...pathKeys);
        if (child === undefined) {
          print(`-bash: ${command}: ${pathArg}: No such file or directory`);
          break;
        } else if (!(child instanceof Dir)) {
          print(`-bash: ${command}: ${pathArg}: Not a directory`);
          break;
        }
        setCurrentPathKeys(pathKeys);
        flush();
        break;
      }
      case 'ls': {
        const pathArg = pathArgs.shift();
        const pathKeys = getPathKeys(pathArg);
        const child = rootDir.getChild(...pathKeys);
        if (child === undefined) {
          print(`-bash: ${command}: ${pathArg}: No such file or directory`);
          break;
        } else if (child instanceof File) {
          print(`<span class="file">${pathKeys.pop()}</span>`);
          break;
        }
        print(child.children.map(child => `<span class="${child instanceof Dir ? 'dir' : 'file'}">${child.key}</span>`));
        break;
      }
      case 'pwd': {
        print('/' + currentPathKeys.join('/'));
        break;
      }
      case 'rm': {
        const pathArg = pathArgs.shift();
        const pathKeys = getPathKeys(pathArg);
        const child = rootDir.getChild(...pathKeys);
        if (child === undefined) {
          print(`-bash: ${command}: ${pathArg}: No such file or directory`);
          break;
        }
        if (child instanceof Dir && !options.includes('r')) {
          print(`-bash: ${command}: ${pathArg}: Is a directory`);
          break;
        }
        if (child instanceof SystemDir && !options.includes('f')) {
          print(`-bash: ${command}: ${pathArg}: Permission denied (try again with -f)`);
          break;
        }
        child.remove();
        refreshRootDir();
        flush();
        break;
      }
      case 'open': {
        const outputs = pathArgs.map((pathArg, i) => {
          const pathKeys = getPathKeys(pathArg);
          const child = rootDir.getChild(...pathKeys);
          if (child === undefined) {
            return `The file /${pathKeys.join('/')} does not exist.`;
          } else if (child instanceof Child) {
            window.setTimeout(() => {
              child.open(history);
            }, (i + 1) * 200);
            return undefined;
          } else {
            return `-bash: ${command}: ${pathArg}: Permission denied`;
          }
        }).filter(v => v);
        if (outputs.length) {
          print(outputs);
        } else {
          flush();
        }
        break;
      }
      case 'clear': {
        setText('');
        setInputs(['']);
        setCursorIndex(0);
        break;
      }
      case 'exit': {
        history.push('/');
        onUpdate({ closing: true });
        break;
      }
      case 'hackertyper': {
        if (sourceCode) {
          setHackertyperLength(0);
          flush();
        } else {
          print(`Error occurred while loading source code.`);
        }
        break;
      }
      default: {
        print(`-bash: ${command}: command not found`);
      }
    }
  };

  return (
    <Window className="TerminalWindow"
            defaultWidth={40 * 16} defaultHeight={28 * 16}
            style={{
              background: 'none',
            }}
            onKeyPress={e => {
              // TODO: support mobile
              const keyCode = e.charCode || e.keyCode;
              if (keyCode === 3) {
                if (hackertyperLength === null) {
                  flush();
                } else {
                  setHackertyperLength(null);
                }
              } else if (keyCode >= 32) {
                if (hackertyperLength === null) {
                  const char = String.fromCharCode(keyCode);
                  if (char !== undefined) {
                    const newInputs = [...inputs];
                    newInputs.splice(cursorIndex, 0, char);
                    setInputs(newInputs);
                    setCursorIndex(cursorIndex + 1);
                  }
                } else {
                  if (hackertyperLength >= sourceCode.length) {
                    setHackertyperLength(null);
                  } else {
                    const chunkLength = (Math.random() * 8 | 0) + 1;
                    setHackertyperLength(hackertyperLength + chunkLength);
                  }
                }
              }
            }}
            onKeyDown={e => {
              const { keyCode } = e;
              switch (keyCode) {
                case 8:
                case 9:
                case 13:
                case 27:
                case 37:
                case 38:
                case 39:
                case 40:
                  e.preventDefault();
                  break;
                default:
              }
              if (hackertyperLength !== null && keyCode !== 27) return;
              switch (keyCode) {
                case 8: {
                  const newInputs = [...inputs];
                  const [removed] = newInputs.splice(cursorIndex - 1, 1);
                  if (removed) {
                    setInputs(newInputs);
                    setCursorIndex(cursorIndex - 1);
                  }
                  break;
                }
                case 9: {
                  if (cursorIndex === inputs.length - 1) {
                    const input = inputs.join('');
                    const incompletePathArg = input.split(/\s+/).pop();
                    const index = incompletePathArg.lastIndexOf('/');
                    const parentPath = incompletePathArg.substring(0, index + 1);
                    const incompleteKey = incompletePathArg.substring(index + 1);
                    const pathKeys = getPathKeys(parentPath);
                    const child = rootDir.getChild(...pathKeys);
                    if (child) {
                      const possibleChildren = child.children.filter(child => child.key.startsWith(incompleteKey));
                      if (possibleChildren.length === 1) {
                        const [possibleChild] = possibleChildren;
                        const leftover = possibleChild.key.substring(incompleteKey.length);
                        const newInputs = [...inputs];
                        newInputs.splice(-1, 0, ...Array.from(leftover));
                        setInputs(newInputs);
                        setCursorIndex(newInputs.length - 1);
                      } else if (possibleChildren.length > 1) {
                        if (tabPressed) {
                          print(possibleChildren.map(child => `<span class="${child instanceof Dir ? 'dir' : 'file'}">${child.key}</span>`).join('\n'), { resetInput: false });
                        }
                        setTabPressed(true);
                      }
                    }
                  }
                  break;
                }
                case 13: {
                  const input = inputs.join('');
                  const newInputHistory = [...inputHistory, input];
                  setInputHistory(newInputHistory);
                  setInputHistoryIndex(newInputHistory.length);
                  processCommand(input);
                  break;
                }
                case 27: {
                  if (hackertyperLength === null) {
                    flush();
                  } else {
                    setHackertyperLength(null);
                  }
                  break;
                }
                case 37: {
                  if (cursorIndex > 0) {
                    setCursorIndex(cursorIndex - 1);
                  }
                  break;
                }
                case 39: {
                  if (cursorIndex < inputs.length - 1) {
                    setCursorIndex(cursorIndex + 1);
                  }
                  break;
                }
                case 38: {
                  if (inputHistoryIndex > 0) {
                    const input = inputHistory[inputHistoryIndex - 1];
                    const newInputs = [...Array.from(input), ''];
                    setInputs(newInputs);
                    setCursorIndex(newInputs.length - 1);
                    setInputHistoryIndex(inputHistoryIndex - 1);
                  }
                  break;
                }
                case 40: {
                  if (inputHistoryIndex < inputHistory.length) {
                    const input = inputHistory[inputHistoryIndex + 1] || '';
                    const newInputs = [...Array.from(input), ''];
                    setInputs(newInputs);
                    setCursorIndex(newInputs.length - 1);
                    setInputHistoryIndex(inputHistoryIndex + 1);
                  }
                  break;
                }
                default:
              }
              if (keyCode !== 9) {
                setTabPressed(false);
              }
            }}
            {...props}>
      {
        isHackertyper ? (
          <div className="line-container">
            {sourceCode.substring(0, hackertyperLength)}
            <span className={classes('input', 'cursor')} ref={cursorRef}/>
          </div>
        ) : (
          <div className="line-container">
            <span dangerouslySetInnerHTML={{ __html: text }}/>
            {getPrompt()}
            {
              inputs.map((input, i) => {
                const isCursor = i === cursorIndex;
                return (
                  <span key={i} className={classes('input', isCursor && 'cursor')}
                        ref={isCursor ? cursorRef : undefined}>{input}</span>
                );
              })
            }
          </div>
        )
      }
      {
        mobile && // TODO: scroll not working
        <input className="mobile-input" type="text" value=""/>
      }
    </Window>
  );
}

export default TerminalWindow;
