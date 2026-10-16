// ---------------------------------------------------------------------------------------
// THE SKIFF'S SETTINGS (the owner, 2026-10-14: the grind's A and D felt reversed one way and will to someone the other): the player's own
// preferences for the Solar Skiff, kept with the settings (scope `settings`: they survive a new build), set on the chat line.
//   INVERT: the balance's answer turned round (the grind's and the manual's): A pushes the lean left instead of right.
//
// Prior art: every flight game's "invert Y"; Tony Hawk's own balance settings.
//
//   game.skiffSettings = new SkiffSettings(game)   .invert   /skiff invert
// ---------------------------------------------------------------------------------------

export class SkiffSettings {
  constructor(game) {
    this.game = game; this.invert = false;
    game.save?.section('skiffSettings', { scope: 'settings', version: 1, dump: () => ({ invert: this.invert }), load: (d) => { this.invert = !!d?.invert; }, reset: () => { this.invert = false; } });
    game.chat?.add('skiff', { help: 'the Solar Skiff\'s settings: /skiff invert (the balance answered the other way)', run: ([what]) => {
      if (what !== 'invert') return game.log?.say('info', 'Settings: /skiff invert.', { key: 'skiff.cmd', throttle: 1 });
      this.invert = !this.invert; game.save?.dirty('skiffSettings');
      game.events?.emit('skiff.setting', { setting: 'invert', on: this.invert, by: 'courier' });
    } });
  }
}
