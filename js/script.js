$(document).ready(() => {
  const $window = $('.window');
  const $directory = $('#directory');
  const $browser = $('#browser');
  const $terminal = $('#terminal');
  const $toolbar = $window.find('.toolbar');
  const $buttonContainer = $toolbar.find('.button-container');
  const $browserIframe = $browser.find('.iframe');
  const $browserAddressbar = $browser.find('.addressbar');
  const $instagram = $('#instagram');
  const $instagramEmbedContainer = $instagram.find('.embed-container');
  const $html = $('html');
  const $labelClock = $('.label-clock');
  const $a = $('a');

  let zIndex = 2;
  let desktop = null;
  let mobile = null;

  const focus = ($selectedWindow) => {
    window.location.hash = $selectedWindow.data('last-hash');
    $window.removeClass('focus');
    $selectedWindow.removeClass('minimize');
    $selectedWindow.addClass('focus');
    $selectedWindow.css('z-index', zIndex++);
  };

  const handleHashChange = () => {
    const { hash } = window.location;
    if (hash.endsWith('-')) {
      const newHash = hash.substring(0, hash.length - 1);
      $(newHash).data('last-hash', null);
      window.location.hash = newHash;
      return;
    }
    const $hash = $(hash);
    if ($hash.hasClass('window', 'open')) {
      const lastHash = $hash.data('last-hash');
      if (lastHash && lastHash !== hash) {
        window.location.hash = lastHash;
        return;
      }
    }
    let selector = hash;
    if (/^#?$/.test(selector)) {
      $window.removeClass('focus');
      return;
    }
    $(`a[href^='${selector}-']`).removeClass('active');
    $(`[id^='${selector.substring(1)}-']`).removeClass('open');
    const parentSelectors = [selector];
    while (true) {
      let parentSelector = null;
      const index = selector.lastIndexOf('-');
      if (!~index) break;
      selector = selector.substring(0, index);
      parentSelectors.unshift(selector);
    }
    const $selectedWindow = $(selector);
    $selectedWindow.data('last-hash', hash);
    focus($selectedWindow);
    let $firstLauncher = null;
    for (let i = 0; i < parentSelectors.length; i++) {
      const selector = parentSelectors[i];
      const $selector = $(selector);
      const $launcher = $(`a[href='${selector}']`);
      if ($launcher.length) {
        $firstLauncher = $launcher.first();
      }
      if (i > 0) {
        const parentSelector = parentSelectors[i - 1];
        $(`a[href^='${parentSelector}-']`).removeClass('active');
        $(`[id^='${parentSelector.substring(1)}-']`).removeClass('open');
      }
      $launcher.addClass('active');
      $selector.addClass('open');
    }
    const windowId = $selectedWindow.attr('id');
    switch (windowId) {
      case 'browser': {
        const $tabContainer = $selectedWindow.find('.tab-container');
        if ($hash.length) {
          const tab = $hash[0];
          tab.click();
        } else {
          const $tab = $('<a class="tab open active"></a>');
          $tab.attr('id', hash.substring(1));
          $tab.attr('href', hash);
          const url = $firstLauncher.data('url');
          $tab.data({ url });
          $tab.mousedown((e) => e.stopPropagation());
          const $icon = $('<div class="icon"></div>');
          const $name = $('<div class="name"></div>');
          const $close = $('<a class="close" href="#"></a>');
          $icon.css('background-image', `url(${$firstLauncher.data('image')})`);
          $name.text($firstLauncher.data('name'));
          $close.attr('href', '#');
          $close.click((e) => {
            e.preventDefault();
            const isOpen = $tab.hasClass('open');
            const prevTab = $tab.prev()[0] || $tab.next()[0];
            $tab.remove();
            if (isOpen) {
              if (prevTab) {
                prevTab.click();
              } else {
                const [buttonClose] = $selectedWindow.find('.button-close');
                buttonClose.click();
              }
            }
          });
          $tab.append($icon);
          $tab.append($name);
          $tab.append($close);
          $tab.click(() => {
            if ($browserIframe.attr('src') !== url) {
              $browserIframe.attr('src', url);
            }
            $browserAddressbar.find('.url').text(url);
          });
          $tab.click();
          $tabContainer.append($tab);
        }
        break;
      }
      case 'instagram': {
        const $titleContainer = $selectedWindow.find('.title-container');
        $titleContainer.empty();
        $titleContainer.append('<div class="icon icon-instagram">');
        $titleContainer.append('<div class="name">Instagram</div>');
        if (!$hash.length) {
          const instagram = $firstLauncher.data('instagram');
          $.ajax({
            url: "https://api.instagram.com/oembed/",
            dataType: "jsonp",
            data: {
              url: `http://instagram.com/p/${instagram}/`,
              omitscript: true,
            },
            success: (res) => {
              $instagramEmbedContainer.attr('id', `instagram-${instagram}`);
              $instagramEmbedContainer.html(res.html);
              instgrm.Embeds.process();
              $instagramEmbedContainer.addClass('open');
            },
          });
        }
        break;
      }
      default: {
        const $titleContainer = $selectedWindow.find('.title-container');
        $titleContainer.empty();
        $titleContainer.append($firstLauncher.children().clone());
        break;
      }
    }
  };
  window.setTimeout(handleHashChange, 0);
  $(window).on('hashchange', handleHashChange);

  $buttonContainer.click(function () {
    if (mobile) {
      const [buttonClose] = $(this).find('.button-close');
      buttonClose.click();
    }
  });
  $buttonContainer.find('.button-close').click(function (e) {
    const $selectedWindow = $(this).parents('.window');
    const id = $selectedWindow.attr('id');
    $(`a[href='#${id}']`).removeClass('active');
    $selectedWindow.removeClass('open');
    $selectedWindow.data('last-hash', null);
    const windowId = $selectedWindow.attr('id');
    switch (windowId) {
      case 'terminal':
        resetTerminal();
        break;
      case 'browser':
        $selectedWindow.find('.tab-container').empty();
        $browserIframe.attr('src', null);
        $browserAddressbar.find('.url').text(null);
        break;
    }
  });
  $buttonContainer.find('.button-minimize').click(function (e) {
    if (mobile) return;
    const $selectedWindow = $(this).parents('.window');
    $selectedWindow.addClass('minimize');
  });
  $buttonContainer.find('.button-maximize').click(function (e) {
    if (mobile) return;
    e.preventDefault();
    const $selectedWindow = $(this).parents('.window');
    $selectedWindow.toggleClass('maximize');
  });

  $browserAddressbar.find('.button-refresh').click((e) => {
    e.preventDefault();
    $browserIframe.attr('src', $browserIframe.attr('src'));
  });
  $browserAddressbar.find('.button-new').click((e) => {
    e.preventDefault();
    window.open($browserIframe.attr('src'));
  });

  $('.desktop').mousedown(() => {
    window.location.hash = '#';
    $window.removeClass('focus');
  });

  $window.mousedown(function (e) {
    e.stopPropagation();
    focus($(this));
  });

  const handleDirectoryKeyDown = (e) => {
    const $selectedDirectory = $directory.find('.panel.open .directory.active').last();
    const { keyCode } = e;
    switch (keyCode) {
      case 38:
        const [prevDirectory] = $selectedDirectory.prev();
        if (prevDirectory) prevDirectory.click();
        break;
      case 40:
        const [nextDirectory] = $selectedDirectory.next();
        if (nextDirectory) nextDirectory.click();
        break;
      case 37:
        const [parentDirectory] = $selectedDirectory.parents('.panel-container').prev().find('.panel.open .directory.active');
        if (parentDirectory) parentDirectory.click();
        break;
      case 39:
        const [childDirectory] = $selectedDirectory.parents('.panel-container').next().find('.panel.open .directory').first();
        if (childDirectory) childDirectory.click();
        break;
    }
  };

  const paths = {
    users: {
      jason: {
        desktop: {},
      },
    },
  };
  const ids = [];
  $('*').each(function () {
    const { id } = this;
    if (id) {
      ids.push(id);
    }
  });
  for (const id of ids) {
    let path = paths.users.jason.desktop;
    const sections = id.split('-');
    for (const section of sections) {
      if (!path[section]) {
        path[section] = {};
      }
      path = path[section];
    }
  }

  let sourceCode = null;
  $.get('/js/script.js', (data) => sourceCode = data, 'text');

  let currentDirectories = null;
  const inputHistory = [];
  let inputHistoryIndex = 0;
  let tabPressed = null;
  let hackertyper = null;
  let hackertyperIndex = null;
  const resetTerminal = () => {
    currentDirectories = ['users', 'jason', 'desktop'];
    tabPressed = false;
    resetHackertyper();
    newInputLine(true);
  };
  window.setTimeout(resetTerminal, 0);
  const resetHackertyper = () => {
    hackertyper = false;
    hackertyperIndex = 0;
  };
  const newInputLine = (clear = false, prompt = true) => {
    const $content = $terminal.find('.content');
    if (clear) {
      $content.empty();
    }
    const $newLine = $('<div class="line">');
    if (prompt) {
      const directories = [...currentDirectories];
      if (directories[0] === 'users' && directories[1] === 'jason') {
        directories.splice(0, 2, '~');
      }
      const path = directories.join('/') || '/';
      $newLine.append(`jason@world:${path}$ `);
    }
    const $cursor = $terminal.find('.cursor');
    $cursor.removeClass('cursor');
    $newLine.append('<div class="letter cursor">');
    $content.append($newLine);
    return $newLine;
  };
  const getDirectories = (pathArg) => {
    const tokens = pathArg ? pathArg.split('/') : [];
    let directories = [...currentDirectories];
    if (tokens[0] === '') {
      directories = [];
      tokens.shift();
    } else if (tokens[0] === '~') {
      directories = ['users', 'jason'];
      tokens.shift();
    }
    for (const token of tokens) {
      switch (token) {
        case '':
        case '.':
          break;
        case '..':
          directories.pop();
          break;
        default:
          directories.push(token);
          break;
      }
    }
    return directories;
  };
  const getPath = (directories) => {
    let path = paths;
    for (const directory of directories) {
      path = path[directory];
    }
    return path;
  };
  const print = (lines, wordBreak = false) => {
    if (!Array.isArray(lines)) lines = [lines];
    const $content = $terminal.find('.content');
    lines.forEach((line) => {
      const $newLine = $('<div class="line">');
      $newLine.html(line);
      if (wordBreak) $newLine.addClass('word-break');
      $content.append($newLine);
    });
  };
  const type = (string) => {
    let $cursor = $terminal.find('.cursor');
    reattachCursor($cursor);
    if (string === undefined) return;
    const array = Array.from(string);
    for (const char of array) {
      if (char === '\n') {
        newInputLine(false, false);
        $cursor = $terminal.find('.cursor');
      } else {
        $cursor.before(`<div class="letter">${char}</div>`);
      }
    }
  };
  const reattachCursor = ($cursor) => {
    $cursor.prev().after($cursor);
  };
  const isDir = (path, directory) => Object.keys(path[directory]).length > 0;
  const processCommand = (input) => {
    const [command, ...args] = input.split(/\s+/);
    switch (command) {
      case '':
        break;
      case 'help': {
        print([
          ' help            show all the possible commands',
          ' whoami          display information about jason',
          ' cd [dir]        change the working directory',
          ' ls [dir]        list directory contents',
          ' pwd             return the working directory',
          ' open [files]    open the files',
          ' clear           clear the terminal screen',
          ' exit            close the terminal window',
          ' hackertyper     ?????',
        ]);
        break;
      }
      case 'whoami': {
        print([
          `<div class="highlight">Jinseo Jason Park</div>:`,
          `I'm a web developer, hackathoner, and traveler.`,
          `I prefer leading a busy life, but also love to waste time having miscellaneous thoughts. Currently I am a highschool senior in Kansas and a remote working developer. ` +
          `During the break, I work for my company on site either in Lyon, France or in Seoul, Korea; and enjoy traveling the world. `,
        ], true);
        break;
      }
      case 'cd': {
        const pathArg = args.shift();
        const directories = getDirectories(pathArg);
        const path = getPath(directories);
        if (path === undefined) {
          if(pathArg.startsWith("-")) {
            print(`-bash: cd: ${pathArg}: invalid option`);
            print(`cd: usage: cd [dir]`);
          } else {
            print(`-bash: ${command}: ${pathArg}: No such file or directory`);
          }
          break;
        } else if (Object.keys(path).length === 0) {
          print(`-bash: ${command}: ${pathArg}: Not a directory`);
          break;
        }
        currentDirectories = [...directories];
        break;
      }
      case 'ls': {
        const pathArg = args.shift();
        const directories = getDirectories(pathArg);
        const path = getPath(directories);
        if (path === undefined) {
          if(pathArg.startsWith("-")) {
            print(`ls: illegal option -- ${pathArg.substring(1, pathArg.length)}`);
            print(`usage: ls [file ...]`);
          } else {
            print(`-bash: ${command}: ${pathArg}: No such file or directory`);
          }
          break;
        } else if (Object.keys(path).length === 0) {
          print(`<div class="file">${directories.pop()}</div>`);
          break;
        }
        print(Object.keys(path).map(directory => `<div class="${isDir(path, directory) ? 'dir' : 'file'}">${directory}</div>`));
        break;
      }
      case 'pwd': {
        print('/' + currentDirectories.join('/'));
        break;
      }
      case 'open': {
        let delay = 0;
        for (const pathArg of args) {
          const directories = getDirectories(pathArg);
          const path = getPath(directories);
          if (path === undefined) {
            if(pathArg.startsWith("-")) {
              print(`open: invalid option -- ${pathArg.substring(1, pathArg.length)}`);
              print(`Usage: open [filenames]`);
            } else {
              print(`The file /${directories.join('/')} does not exist.`);
            }
            continue;
          }
          if (directories[0] === 'users' && directories[1] === 'jason' && directories[2] === 'desktop') {
            directories.splice(0, 3);
          }
          const hash = '#' + directories.join('-');
          if (hash === '#' || !$(hash).length) {
            print(`-bash: ${command}: ${pathArg}: Permission Denied`);
            continue;
          }
          window.setTimeout(() => {
            window.location.hash = hash;
          }, delay += 200);
        }
        break;
      }
      case 'clear': {
        newInputLine(true);
        return;
      }
      case 'exit': {
        const [buttonClose] = $terminal.find('.button-close');
        buttonClose.click();
        return;
      }
      case 'hackertyper': {
        if (sourceCode) {
          hackertyper = true;
          newInputLine(true, false);
          return;
        } else {
          print(`Error occurred while loading source code.`);
        }
        break;
      }
      default: {

        print(`-bash: ${command}: command not found`);
        break;
      }
    }
    newInputLine();
    const [cursor] = $terminal.find('.cursor');
    cursor.scrollIntoView();
  };
  const handleTerminalKeyDown = (e) => {
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
    }
    if (hackertyper && keyCode !== 27) return;
    const $cursor = $terminal.find('.cursor');
    const $prev = $cursor.prev('.letter');
    const $next = $cursor.next('.letter');
    const $line = $cursor.parents('.line');
    switch (keyCode) {
      case 8: {
        if ($prev.length) {
          $prev.remove();
          reattachCursor($cursor);
        }
        break;
      }
      case 9: {
        if (!$next.length) {
          const input = $line.children('.letter').text();
          const incompletePathArg = input.split(/\s+/).pop();
          const index = incompletePathArg.lastIndexOf('/');
          const parentDirectory = incompletePathArg.substring(0, index + 1);
          const incompleteDirectory = incompletePathArg.substring(index + 1);
          const directories = getDirectories(parentDirectory);
          const path = getPath(directories);
          if (path) {
            const possibleDirectories = Object.keys(path).filter(directory => directory.startsWith(incompleteDirectory));
            if (possibleDirectories.length === 1) {
              const directory = possibleDirectories[0];
              const leftover = directory.substring(incompleteDirectory.length);
              type(leftover);
            } else if (possibleDirectories.length > 1) {
              if (tabPressed) {
                $cursor.detach();
                $line.before($line.clone());
                for (const directory of possibleDirectories) {
                  $line.before(`<div class="line"><div class="${isDir(path, directory) ? 'dir' : 'file'}">${directory}</div></div>`);
                }
                $cursor.appendTo($line);
              }
              tabPressed = true;
            }
          }
        }
        break;
      }
      case 13: {
        const input = $line.children('.letter').text();
        inputHistory.push(input);
        inputHistoryIndex = inputHistory.length;
        processCommand(input);
        break;
      }
      case 27: {
        resetHackertyper();
        newInputLine();
        break;
      }
      case 37: {
        if ($prev.length) {
          $prev.addClass('cursor');
          $cursor.removeClass('cursor');
        }
        break;
      }
      case 38: {
        if (inputHistoryIndex > 0) {
          const input = inputHistory[--inputHistoryIndex];
          $cursor.detach();
          $line.find('.letter').remove();
          $line.append($cursor);
          type(input);
        }
        break;
      }
      case 39: {
        if ($next.length) {
          $next.addClass('cursor');
          $cursor.removeClass('cursor');
        }
        break;
      }
      case 40: {
        if (inputHistoryIndex < inputHistory.length) {
          const input = inputHistory[++inputHistoryIndex];
          $cursor.detach();
          $line.find('.letter').remove();
          $line.append($cursor);
          type(input);
        }
        break;
      }
    }
    if (keyCode !== 9) tabPressed = false;
    const [cursor] = $cursor;
    cursor.scrollIntoView();
  };
  const handleTerminalKeyPress = (e) => {
    const keyCode = e.charCode || e.keyCode;
    if (keyCode === 3) {
      resetHackertyper();
      newInputLine();
    } else if (keyCode >= 32) {
      if (hackertyper) {
        const randomLength = (Math.random() * 8 | 0) + 1;
        const string = sourceCode.substr(hackertyperIndex, randomLength);
        if (!string) {
          resetHackertyper();
          newInputLine();
        }
        hackertyperIndex += randomLength;
        type(string);
      } else {
        const string = String.fromCharCode(keyCode);
        type(string);
      }
    }
    const [cursor] = $terminal.find('.cursor');
    cursor.scrollIntoView();
  };

  $(document).keydown((e) => {
    if ($directory.hasClass('focus')) {
      handleDirectoryKeyDown(e);
    } else if ($terminal.hasClass('focus')) {
      handleTerminalKeyDown(e);
    }
  });
  $(document).keypress((e) => {
    if ($terminal.hasClass('focus')) {
      handleTerminalKeyPress(e);
    }
  });

  $window.each(function (i) {
    const top = 20 + i * 20;
    const left = 20 + i * 20;
    $(this).css({ top, left });
  });

  let $selectedWindow = null;
  let windowStyle = {};
  let cursor = {};
  $toolbar.mousedown(function (e) {
    if (mobile) return;
    if (e.which !== 1) return;
    $selectedWindow = $(this).parents('.window');
    if ($selectedWindow.hasClass('maximize')) return;
    $selectedWindow.addClass('moving');
    windowStyle = $selectedWindow.position();
    cursor.x = e.clientX;
    cursor.y = e.clientY;
    $(document).mousemove((e) => {
      const dx = e.clientX - cursor.x;
      const dy = e.clientY - cursor.y;
      windowStyle.left += dx;
      windowStyle.top += dy;
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      $selectedWindow.css(windowStyle);
    });
    $(document).mouseup(() => {
      $selectedWindow.removeClass('moving');
      $(document).off('mousemove');
      $(document).off('mouseup');
    });
  });
  $a.mousedown((e) => {
    e.stopPropagation();
  });
  [
    ['.border-left', 'left', 'width', 'x', 'clientX'],
    ['.border-top', 'top', 'height', 'y', 'clientY'],
    ['.border-right', null, 'width', 'x', 'clientX'],
    ['.border-bottom', null, 'height', 'y', 'clientY'],
  ].map(([selector, pos, dim, xy, clientXY ]) => {
    let $selectedWindow = null;
    let windowStyle = {};
    let cursor = {};
    $window.find(selector).mousedown(function (e) {
      if (mobile) return;
      if (e.which !== 1) return;
      $selectedWindow = $(this).parents('.window');
      if ($selectedWindow.hasClass('maximize')) return;
      $selectedWindow.addClass('resizing');
      if (pos) {
        const position = $selectedWindow.position();
        windowStyle[pos] = position[pos];
      }
      windowStyle[dim] = $selectedWindow[dim]();
      cursor[xy] = e[clientXY];
      $(document).mousemove((e) => {
        const delta = e[clientXY] - cursor[xy];
        if (pos) {
          windowStyle[pos] += delta;
          windowStyle[dim] -= delta;
        } else {
          windowStyle[dim] += delta;
        }
        cursor[xy] = e[clientXY];
        if (windowStyle.width < 280 || windowStyle.height < 60) return;
        $selectedWindow.css(windowStyle);
      });
      $(document).mouseup(() => {
        $selectedWindow.removeClass('resizing');
        $(document).off('mousemove');
        $(document).off('mouseup');
      });
    });
  });

  const refreshClock = () => {
    const two = (x) => x < 10 ? `0${x}` : x;
    const date = new Date();
    const H = date.getHours();
    const m = date.getMinutes();
    const hh = two(H % 12 || 12);
    const mm = two(m);
    const A = ['AM', 'PM'][H / 12 | 0];
    const format = `${hh}:${mm} ${A}`;
    $labelClock.find('.name').text(format);
  };
  window.setInterval(refreshClock, 1000);
  refreshClock();

  $a.each(function () {
    const href = $(this).attr('href');
    if (!href.startsWith('#')) {
      $(this).attr('target', '_blank');
      $(this).attr('rel', 'noopener');
      $(this).addClass('link-external');
    }
  });

  const onResize = () => {
    const { clientWidth } = document.body;
    desktop = clientWidth > 512;
    mobile = !desktop;
    $html.toggleClass('desktop', desktop);
    $html.toggleClass('mobile', mobile);
  };
  onResize();
  window.onresize = onResize;
});