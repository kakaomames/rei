import io.netty.buffer.ByteBuf;

public record aen(is b, is c) implements aay<adb> {
   public static final aao<ByteBuf, aen> a;

   public aen(is param1, is param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<aen> a() {
      return ahz.L;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public is b() {
      return this.b;
   }

   public is e() {
      return this.c;
   }

   static {
      a = aao.a(is.b, aen::b, is.b, aen::e, aen::new);
   }
}
