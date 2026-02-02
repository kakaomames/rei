import com.mojang.serialization.Codec;

public enum ai implements bhh {
   a("task", l.k),
   b("challenge", l.f),
   c("goal", l.k);

   public static final Codec<ai> d = bhh.a(ai::values);
   private final String e;
   private final l f;
   private final yh g;

   private ai(final String param3, final l param4) {
      this.e = $$0;
      this.f = $$1;
      this.g = yh.c("advancements.toast." + $$0);
   }

   public l a() {
      return this.f;
   }

   public yh b() {
      return this.g;
   }

   public String c() {
      return this.e;
   }

   public yw a(ac $$0, axg $$1) {
      return yh.a("chat.type.advancement." + this.e, $$1.R_(), ab.a($$0));
   }

   // $FF: synthetic method
   private static ai[] d() {
      return new ai[]{a, b, c};
   }
}
