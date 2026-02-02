import io.netty.buffer.ByteBuf;

public record aje(is b, boolean c) implements aay<aib> {
   public static final aao<ByteBuf, aje> a;

   public aje(is param1, boolean param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<aje> a() {
      return ahz.bV;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public is b() {
      return this.b;
   }

   public boolean e() {
      return this.c;
   }

   static {
      a = aao.a(is.b, aje::b, aam.b, aje::e, aje::new);
   }
}
