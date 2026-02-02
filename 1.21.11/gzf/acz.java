import org.jspecify.annotations.Nullable;

public record acz(amo b, @Nullable byte[] c) implements aay<acy> {
   public static final aao<wx, acz> a = aay.a(acz::a, acz::new);

   private acz(wx $$0) {
      this($$0.q(), (byte[])$$0.c((aap)abr.b));
   }

   public acz(amo param1, @Nullable byte[] param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private void a(wx $$0) {
      $$0.a(this.b);
      $$0.a((Object)this.c, (aaq)abr.b);
   }

   public aba<acz> a() {
      return acx.b;
   }

   public void a(acy $$0) {
      $$0.a(this);
   }

   public amo b() {
      return this.b;
   }

   @Nullable
   public byte[] e() {
      return this.c;
   }
}
